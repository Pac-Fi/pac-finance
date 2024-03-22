// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface INativeYieldDistribute {
    function aTokenBalanceChange(address user) external;

    function distributeYield(uint256 amount) external payable;
}
