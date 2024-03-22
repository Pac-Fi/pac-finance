// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IGasRefund} from "./interfaces/IGasRefund.sol";
import {PercentageMath} from "./core-v3/contracts/protocol/libraries/math/PercentageMath.sol";
import {IBlast} from "./interfaces/IBlast.sol";
import {PacPoolWrapper} from "./PacPoolWrapper.sol";
import {IPool} from "./core-v3/contracts/interfaces/IPool.sol";

contract GasRefund is Initializable, OwnableUpgradeable {
    using PercentageMath for uint256;

    address public immutable BLAST;

    mapping(address => uint256) private _balances;
    mapping(IGasRefund.RefundType => uint256) private _refundRatio;
    address public POOL_WRAPPER;

    error AddressZero();

    event GasRefunded(address user, uint256 amount);

    event GasClaimed(address user, uint256 amount);

    modifier onlyPoolWrapper() {
        require(msg.sender == POOL_WRAPPER, "only pool wrapper");
        _;
    }

    constructor(address _poolWrapper, address _blast) {
        if (address(_poolWrapper) == address(0)) revert AddressZero();

        POOL_WRAPPER = _poolWrapper;
        BLAST = _blast;
    }

    function initialize() public initializer {
        __Ownable_init();

        _refundRatio[IGasRefund.RefundType.SUPPLY] = 7000;
        _refundRatio[IGasRefund.RefundType.WITHDRAW] = 8000;
        _refundRatio[IGasRefund.RefundType.BORROW] = 8000;
        _refundRatio[IGasRefund.RefundType.REPAY] = 7000;
        _refundRatio[IGasRefund.RefundType.LEVERAGEDEPOSIT] = 6000;
        _refundRatio[IGasRefund.RefundType.MULTIPLIERDEPOSIT] = 6000;

        if (BLAST != address(0)) {
            IBlast(BLAST).configureClaimableGas();
        }
    }

    function gasBalance(address user) external view returns (uint256) {
        return _balances[user];
    }

    function addGasRefund(
        address user,
        uint256 amount,
        IGasRefund.RefundType refundType
    ) external onlyPoolWrapper {
        uint256 ratio = _refundRatio[refundType];
        uint256 actualAmount = amount.percentMul(ratio);
        _balances[user] += actualAmount;
        emit GasRefunded(user, actualAmount);
    }

    function claimGas() external {
        uint256 balance = _balances[msg.sender];
        _balances[msg.sender] = 0;
        _safeTransferETH(msg.sender, balance);
        emit GasClaimed(msg.sender, balance);
    }

    function setRefundRatio(
        IGasRefund.RefundType refundType,
        uint256 ratio
    ) external onlyOwner {
        _refundRatio[refundType] = ratio;
    }

    function claimRefundedGas(address recipient) external onlyOwner {
        IBlast(BLAST).claimMaxGas(address(this), recipient);
    }

    function setPoolWrapper(address _poolWrapper) external {
        require(
            POOL_WRAPPER == address(0) || owner() == _msgSender(),
            "Ownable: caller is not the owner"
        );
        POOL_WRAPPER = _poolWrapper;
    }

    receive() external payable {}

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }
}
