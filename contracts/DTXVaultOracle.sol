// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {ICLSynchronicityPriceAdapter} from "./interfaces/ICLSynchronicityPriceAdapter.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IDTXVault} from "./interfaces/IDTXVault.sol";

contract DTXVaultOracle is ICLSynchronicityPriceAdapter {
    using SafeCast for uint256;
    ICLSynchronicityPriceAdapter public immutable underlyingAssetOracle;
    address public immutable vault;
    uint8 internal immutable DECIMALS;

    constructor(
        address _underlyingAssetOracle,
        address _vault,
        uint8 _decimals
    ) {
        underlyingAssetOracle = ICLSynchronicityPriceAdapter(
            _underlyingAssetOracle
        );
        vault = _vault;
        DECIMALS = _decimals;
    }

    /// @inheritdoc ICLSynchronicityPriceAdapter
    function latestAnswer() public view virtual override returns (int256) {
        int256 exchangeRate = IDTXVault(vault).lpPrice().toInt256();
        require(exchangeRate < 2e30, "invalid lp price");
        int256 underlyingPrice = underlyingAssetOracle.latestAnswer();
        return (underlyingPrice * exchangeRate) / 1e30;
    }

    function decimals() external view returns (uint8) {
        return DECIMALS;
    }
}
