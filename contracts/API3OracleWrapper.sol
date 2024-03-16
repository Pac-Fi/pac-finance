// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@api3/contracts/v0.8/interfaces/IProxy.sol";
import {ICLSynchronicityPriceAdapter} from "./interfaces/ICLSynchronicityPriceAdapter.sol";

contract API3OracleWrapper is Ownable, ICLSynchronicityPriceAdapter {
    // The proxy contract address obtained from the API3 Market UI.
    address public immutable proxyAddress;

    uint256 public validityDuration = 1 days;

    constructor(address _proxyAddress) {
        proxyAddress = _proxyAddress;
    }

    function setValidityDuration(uint256 _validityDuration) external onlyOwner {
        validityDuration = _validityDuration;
    }

    /// @inheritdoc ICLSynchronicityPriceAdapter
    function latestAnswer() public view virtual override returns (int256) {
        (int224 value, uint256 timestamp) = IProxy(proxyAddress).read();
        require(block.timestamp - timestamp < validityDuration, "price expired");
        //convert decimals, api3 decimal is 18
        int256 convertedValue = int256(value) / 1e10;
        return convertedValue;
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }
}
