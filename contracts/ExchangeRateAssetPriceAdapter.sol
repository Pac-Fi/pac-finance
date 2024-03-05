// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {ICLSynchronicityPriceAdapter} from "./interfaces/ICLSynchronicityPriceAdapter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ICToken} from "./interfaces/ICToken.sol";

contract ExchangeRateAssetPriceAdapter is Ownable, ICLSynchronicityPriceAdapter {
    using SafeCast for uint256;
    ICLSynchronicityPriceAdapter public immutable underlyingAssetOracle;
    address public immutable cToken;
    uint8 internal immutable DECIMALS;
    int256 public cTokenExchangeRate;

    constructor(
        address _underlyingAssetOracle,
        address _cToken,
        uint8 _decimals
    ) {
        underlyingAssetOracle = ICLSynchronicityPriceAdapter(_underlyingAssetOracle);
        cToken = _cToken;
        DECIMALS = _decimals;
        cTokenExchangeRate = ICToken(cToken).exchangeRateStored().toInt256();
    }

    function syncExchangeRate() external onlyOwner {
        cTokenExchangeRate = ICToken(cToken).exchangeRateStored().toInt256();
    }

    /// @inheritdoc ICLSynchronicityPriceAdapter
    function latestAnswer() public view virtual override returns (int256) {
        int256 underlyingPrice = underlyingAssetOracle.latestAnswer();
        return underlyingPrice * cTokenExchangeRate / 1e18;
    }

    function decimals() external view returns (uint8) {
        return DECIMALS;
    }
}
