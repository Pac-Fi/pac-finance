// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IGasRefund} from "./interfaces/IGasRefund.sol";
import {PercentageMath} from "./core-v3/contracts/protocol/libraries/math/PercentageMath.sol";

contract GasRefund is Ownable {
    using PercentageMath for uint256;

    address public immutable POOL_WRAPPER;

    mapping(address => uint256) private _balances;
    mapping(IGasRefund.RefundType => uint256) private _refundRatio;

    error AddressZero();

    event GasRefunded(address user, uint256 amount);

    event GasClaimed(address user, uint256 amount);

    modifier onlyPoolWrapper() {
        require(msg.sender == POOL_WRAPPER, "only pool wrapper");
        _;
    }

    constructor(address _poolWrapper) {
        if (address(_poolWrapper) == address(0)) revert AddressZero();

        POOL_WRAPPER = _poolWrapper;
        _refundRatio[IGasRefund.RefundType.SUPPLY] = 7000;
        _refundRatio[IGasRefund.RefundType.WITHDRAW] = 8000;
        _refundRatio[IGasRefund.RefundType.BORROW] = 8000;
        _refundRatio[IGasRefund.RefundType.REPAY] = 7000;
        _refundRatio[IGasRefund.RefundType.LEVERAGEDEPOSIT] = 6000;
        _refundRatio[IGasRefund.RefundType.MULTIPLIERDEPOSIT] = 6000;
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

    receive() external payable {}

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }
}
