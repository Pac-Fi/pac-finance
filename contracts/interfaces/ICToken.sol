// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface ICToken {
    function exchangeRateStored() external view returns (uint);
}
