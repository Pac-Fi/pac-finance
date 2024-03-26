// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@api3/contracts/v0.8/interfaces/IProxy.sol";
import {ICLSynchronicityPriceAdapter} from "./interfaces/ICLSynchronicityPriceAdapter.sol";

contract ezETHOracle is Ownable, ICLSynchronicityPriceAdapter
{
    address public immutable ethProxy;
    address public immutable exchangeRateProxy;

    uint256 public validityDuration = 1 days;

    constructor(address _proxyAddress, address _exchangeRateProxy) {
        ethProxy = _proxyAddress;
        exchangeRateProxy = _exchangeRateProxy;
    }

    function setValidityDuration(uint256 _validityDuration) external onlyOwner {
        validityDuration = _validityDuration;
    }

    /// @inheritdoc ICLSynchronicityPriceAdapter
    function latestAnswer() public view virtual override returns (int256) {
        (int224 value, uint256 timestamp) = IProxy(ethProxy).read();
        require(
            block.timestamp - timestamp < validityDuration,
            "price expired"
        );

        int224 exchangeRate;
        (exchangeRate, timestamp) = IProxy(exchangeRateProxy).read();
        require(
            block.timestamp - timestamp < validityDuration,
            "exchange rate expired"
        );

        //convert decimals, api3 decimal is 18
        int256 convertedValue = int256(value) * int256(exchangeRate)/ 1e18 / 1e10;
        return convertedValue;
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }
}
