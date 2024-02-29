// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {IPyth} from "./interfaces/IPyth.sol";
import {ICLSynchronicityPriceAdapter} from "./interfaces/ICLSynchronicityPriceAdapter.sol";

contract ERC20OracleWrapper is ICLSynchronicityPriceAdapter {
    IPyth internal immutable PYTH;
    bytes32 internal immutable FEED_ID;
    uint256 internal immutable EXPIRATION_PERIOD;
    uint8 internal immutable DECIMALS;

    constructor(
        address pyth,
        bytes32 feedId,
        uint256 expirationPeriod,
        uint8 _decimals
    ) {
        PYTH = IPyth(pyth);
        FEED_ID = feedId;
        EXPIRATION_PERIOD = expirationPeriod;
        DECIMALS = _decimals;
    }

    /// @inheritdoc ICLSynchronicityPriceAdapter
    function latestAnswer() public view virtual override returns (int256) {
        return PYTH.getPriceNoOlderThan(FEED_ID, EXPIRATION_PERIOD).price;
    }

    function decimals() external view returns (uint8) {
        return DECIMALS;
    }
}
