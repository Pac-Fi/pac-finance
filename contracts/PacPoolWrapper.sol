// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IPool, DataTypes} from "./core-v3/contracts/interfaces/IPool.sol";
import {IPoolAddressesProvider} from "./core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IWETH} from "./core-v3/contracts/misc/interfaces/IWETH.sol";
import {IFlashLoanSimpleReceiver} from "./core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";
import {IAToken} from "./core-v3/contracts/interfaces/IAToken.sol";
import {DataTypesHelper} from "./periphery-v3/contracts/libraries/DataTypesHelper.sol";
import {IGasRefund} from "./interfaces/IGasRefund.sol";
import {IBlast} from "./interfaces/IBlast.sol";

/// @title PAC Pool Wrapper Contract
/// @author PAC
contract PacPoolWrapper is Ownable, ReentrancyGuard, IFlashLoanSimpleReceiver {
    using SafeERC20 for IERC20;

    /// @notice Lending Pool address
    IPool public immutable POOL;

    /// @notice Wrapped ETH contract address
    IWETH public immutable WETH;

    address public gasRefund;

    uint16 private constant referralCode = 0;

    error AddressZero();

    error ReceiveNotAllowed();

    error InvalidFlashLoan();

    error ZeroAmount();

    error InvalidMsgValue();

    /**
     * @dev Emitted during leverageDeposit()
     * @param user The address of the user
     * @param asset The address of the asset
     * @param cashAmount The amount of cash for the deposit
     * @param borrowAmount The amount borrowed from lending pool for the deposit
     **/
    event LeverageDeposit(
        address user,
        address asset,
        uint256 cashAmount,
        uint256 borrowAmount
    );

    /**
     * @dev Emitted during rescueToken()
     * @param token The address of the token
     * @param to The address of the recipient
     * @param amount The amount being rescued
     **/
    event RescueToken(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    constructor(address _lendingPool, address _weth) {
        if (address(_lendingPool) == address(0)) revert AddressZero();
        if (address(_weth) == address(0)) revert AddressZero();

        POOL = IPool(_lendingPool);
        WETH = IWETH(_weth);
        WETH.approve(_lendingPool, type(uint256).max);

        address blast = POOL.BLAST();
        if (blast != address(0)) {
            IBlast(blast).configureClaimableGas();
        }
    }

    /**
     * @dev Only WETH contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract.
     */
    receive() external payable {
        if (msg.sender != address(WETH)) revert ReceiveNotAllowed();
    }

    function _addGasRefund(
        uint256 gasConsumed,
        IGasRefund.RefundType refundType
    ) internal {
        if (gasRefund != address(0)) {
            uint256 refund = gasConsumed * tx.gasprice;
            IGasRefund(gasRefund).addGasRefund(msg.sender, refund, refundType);
        }
    }

    /**
     * @dev deposits WETH into the reserve, using native ETH. A corresponding amount of the overlying asset (aTokens)
     * is minted.
     * @param onBehalfOf address of the user who will receive the aTokens representing the deposit
     **/
    function depositETH(address onBehalfOf) external payable nonReentrant {
        WETH.deposit{value: msg.value}();
        uint256 gasBegin = gasleft();
        POOL.deposit(address(WETH), msg.value, onBehalfOf, referralCode);
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.SUPPLY);
    }

    /**
     * @dev withdraws the WETH _reserves of msg.sender.
     * @param amount amount of aWETH to withdraw and receive native ETH
     * @param to address of the user who will receive native ETH
     */
    function withdrawETH(uint256 amount, address to) external nonReentrant {
        IAToken aWETH = IAToken(
            POOL.getReserveData(address(WETH)).aTokenAddress
        );
        uint256 userBalance = aWETH.balanceOf(msg.sender);
        uint256 amountToWithdraw = amount;

        // if amount is equal to uint(-1), the user wants to redeem everything
        if (amount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }
        aWETH.transferFrom(msg.sender, address(this), amountToWithdraw);

        uint256 gasBegin = gasleft();
        POOL.withdraw(address(WETH), amountToWithdraw, address(this));
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.WITHDRAW);

        WETH.withdraw(amountToWithdraw);
        _safeTransferETH(to, amountToWithdraw);
    }

    /**
     * @dev repays a borrow on the WETH reserve, for the specified amount (or for the whole amount, if uint256(-1) is specified).
     * @param amount the amount to repay, or uint256(-1) if the user wants to repay everything
     * @param rateMode the rate mode to repay
     * @param onBehalfOf the address for which msg.sender is repaying
     */
    function repayETH(
        uint256 amount,
        uint256 rateMode,
        address onBehalfOf
    ) external payable nonReentrant {
        (uint256 stableDebt, uint256 variableDebt) = DataTypesHelper
            .getUserCurrentDebt(onBehalfOf, POOL.getReserveData(address(WETH)));

        uint256 paybackAmount = DataTypes.InterestRateMode(rateMode) ==
            DataTypes.InterestRateMode.STABLE
            ? stableDebt
            : variableDebt;

        if (amount < paybackAmount) {
            paybackAmount = amount;
        }
        require(
            msg.value >= paybackAmount,
            "msg.value is less than repayment amount"
        );
        WETH.deposit{value: paybackAmount}();

        uint256 gasBegin = gasleft();
        POOL.repay(address(WETH), msg.value, rateMode, onBehalfOf);
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.REPAY);

        // refund remaining dust eth
        if (msg.value > paybackAmount)
            _safeTransferETH(msg.sender, msg.value - paybackAmount);
    }

    /**
     * @dev borrow WETH, unwraps to ETH and send both the ETH and DebtTokens to msg.sender, via `approveDelegation` and onBehalf argument in `Pool.borrow`.
     * @param amount the amount of ETH to borrow
     * @param interestRateMode the interest rate mode
     */
    function borrowETH(
        uint256 amount,
        uint256 interestRateMode
    ) external nonReentrant {
        uint256 gasBegin = gasleft();
        POOL.borrow(
            address(WETH),
            amount,
            interestRateMode,
            referralCode,
            msg.sender
        );
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.BORROW);

        WETH.withdraw(amount);
        _safeTransferETH(msg.sender, amount);
    }

    /**
     * @notice Supplly an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
     * - E.g. User supplies 100 USDC and gets in return 100 aUSDC
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens, same as msg.sender if the user
     *   wants to receive them on his own wallet, or a different address if the beneficiary of aTokens
     *   is a different wallet
     */
    function supplyERC20(
        address asset,
        uint256 amount,
        address onBehalfOf
    ) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (amount > 0) {
            IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        }

        _checkApprove(asset);

        uint256 gasBegin = gasleft();
        POOL.supply(asset, amount, onBehalfOf, referralCode);
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.SUPPLY);
    }

    /**
     * @notice Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
     * E.g. User has 100 aUSDC, calls withdraw() and receives 100 USDC, burning the 100 aUSDC
     * @param asset The address of the underlying asset to withdraw
     * @param amount The underlying amount to be withdrawn
     *   - Send the value type(uint256).max in order to withdraw the whole aToken balance
     * @param to The address that will receive the underlying, same as msg.sender if the user
     *   wants to receive it on his own wallet, or a different address if the beneficiary is a
     *   different wallet
     */
    function withdrawERC20(
        address asset,
        uint256 amount,
        address to
    ) external nonReentrant {
        IAToken aToken = IAToken(
            POOL.getReserveData(address(asset)).aTokenAddress
        );
        uint256 userBalance = aToken.balanceOf(msg.sender);
        uint256 amountToWithdraw = amount;

        // if amount is equal to uint(-1), the user wants to redeem everything
        if (amount == type(uint256).max) {
            amountToWithdraw = userBalance;
        }
        aToken.transferFrom(msg.sender, address(this), amountToWithdraw);

        uint256 gasBegin = gasleft();
        POOL.withdraw(asset, amountToWithdraw, to);
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.WITHDRAW);
    }

    function borrowERC20(
        address asset,
        uint256 amount,
        uint256 interestRateMode
    ) external nonReentrant {
        uint256 gasBegin = gasleft();
        POOL.borrow(asset, amount, interestRateMode, referralCode, msg.sender);
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.BORROW);

        IERC20(asset).safeTransfer(msg.sender, amount);
    }

    function repayERC20(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external nonReentrant {
        (uint256 stableDebt, uint256 variableDebt) = DataTypesHelper
            .getUserCurrentDebt(onBehalfOf, POOL.getReserveData(asset));

        uint256 paybackAmount = DataTypes.InterestRateMode(interestRateMode) ==
            DataTypes.InterestRateMode.STABLE
            ? stableDebt
            : variableDebt;

        if (amount < paybackAmount) {
            paybackAmount = amount;
        }

        if (paybackAmount == 0) revert ZeroAmount();
        IERC20(asset).safeTransferFrom(
            msg.sender,
            address(this),
            paybackAmount
        );

        uint256 gasBegin = gasleft();
        POOL.repay(asset, paybackAmount, interestRateMode, onBehalfOf);
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.REPAY);
    }

    /**
     * @dev Loop the deposit and borrow of an asset
     * @param asset to deposit
     * @param cashAmount cash amount for the deposit
     * @param borrowAmount borrow amount for the deposit
     **/
    function leverageDeposit(
        address asset,
        uint256 cashAmount,
        uint256 borrowAmount
    ) external payable nonReentrant {
        if (borrowAmount == 0) revert ZeroAmount();

        if (asset == address(0)) {
            if (cashAmount != msg.value) revert InvalidMsgValue();
            WETH.deposit{value: cashAmount}();
            asset = address(WETH);
        } else {
            if (msg.value != 0) revert InvalidMsgValue();
            if (cashAmount > 0) {
                IERC20(asset).safeTransferFrom(
                    msg.sender,
                    address(this),
                    cashAmount
                );
            }
        }

        uint256 gasBegin = gasleft();
        bytes memory params = abi.encode(msg.sender, cashAmount, borrowAmount);
        POOL.flashLoanSimple(
            address(this),
            asset,
            borrowAmount,
            params,
            referralCode
        );
        uint256 gasEnd = gasleft();
        _addGasRefund(gasBegin - gasEnd, IGasRefund.RefundType.LEVERAGEDEPOSIT);

        emit LeverageDeposit(msg.sender, asset, cashAmount, borrowAmount);
    }

    /// @inheritdoc IFlashLoanSimpleReceiver
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        //decode param
        (address user, uint256 cashAmount, uint256 borrowAmount) = abi.decode(
            params,
            (address, uint256, uint256)
        );

        if (
            msg.sender != address(POOL) ||
            initiator != address(this) ||
            borrowAmount != amount
        ) revert InvalidFlashLoan();

        _checkApprove(asset);

        //supply asset
        uint256 supplyAmount = cashAmount + borrowAmount - premium;
        POOL.supply(asset, supplyAmount, user, referralCode);

        //borrow asset
        POOL.borrow(asset, borrowAmount, 2, referralCode, user);

        //nothing need to do for repaying flash loan since we've approved asset.

        return true;
    }

    /// @inheritdoc IFlashLoanSimpleReceiver
    function ADDRESSES_PROVIDER()
        external
        view
        returns (IPoolAddressesProvider)
    {
        return POOL.ADDRESSES_PROVIDER();
    }

    /**
     * @notice Rescue erc20/ETH from this contract address. Only owner can call this function
     * @param token The token address to be rescued
     * @param to The account address to receive token
     * @param amount The amount to be rescued
     **/
    function rescueToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            _safeTransferETH(to, amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
        emit RescueToken(token, to, amount);
    }

    /**
     * @notice Set gas refund address. Only owner can call this function
     * @param _gasRefund The address of user gas refund contract
     **/
    function setGasRefund(address _gasRefund) external onlyOwner {
        gasRefund = _gasRefund;
    }

    /**
     * @dev transfer ETH to an address, revert if it fails.
     * @param to recipient of the transfer
     * @param value the amount to send
     */
    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }

    /**
     * @notice Approves token allowance for lending pool.
     * @param asset Address of the asset
     **/
    function _checkApprove(address asset) internal {
        if (IERC20(asset).allowance(address(this), address(POOL)) == 0) {
            IERC20(asset).safeApprove(address(POOL), type(uint256).max);
        }
    }

    function claimRefundedGas(address recipient) external onlyOwner {
        address blast = POOL.BLAST();
        if (blast != address(0)) {
            IBlast(blast).claimMaxGas(address(this), recipient);
        }
    }
}
