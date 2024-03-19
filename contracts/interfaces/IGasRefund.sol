// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IGasRefund {
    enum RefundType {
        SUPPLY,
        WITHDRAW,
        BORROW,
        REPAY,
        LEVERAGEDEPOSIT,
        MULTIPLIERDEPOSIT
    }

    function addGasRefund(
        address user,
        uint256 amount,
        RefundType refundType
    ) external;
}
