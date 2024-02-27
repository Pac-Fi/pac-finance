// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IPoolAddressesProvider} from "./core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IAaveOracle} from "./core-v3/contracts/interfaces/IAaveOracle.sol";
import {ICLSynchronicityPriceAdapter} from "./interfaces/ICLSynchronicityPriceAdapter.sol";
import {IUniswapV2Pair} from "./dependencies/uniswapv2/interfaces/IUniswapV2Pair.sol";
import {SqrtLib} from "./libs/SqrtLib.sol";

contract UniswapV2OracleWrapper is ICLSynchronicityPriceAdapter {
    using SafeCast for uint256;

    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    address immutable underlyingAsset;
    address immutable token0;
    address immutable token1;
    uint8 immutable token0Decimal;
    uint8 immutable token1Decimal;
    uint256 immutable KLIMIT;

    constructor(address _underlyingAsset, address _addressProvider) {
        underlyingAsset = _underlyingAsset;
        token0 = IUniswapV2Pair(_underlyingAsset).token0();
        token1 = IUniswapV2Pair(_underlyingAsset).token1();
        token0Decimal = IERC20Metadata(token0).decimals();
        token1Decimal = IERC20Metadata(token1).decimals();
        KLIMIT = (10 ** token0Decimal) * (10 ** token1Decimal);

        ADDRESSES_PROVIDER = IPoolAddressesProvider(_addressProvider);
    }

    /// @inheritdoc ICLSynchronicityPriceAdapter
    function latestAnswer() public view virtual override returns (int256) {
        (uint256 _reserve0, uint256 _reserve1, ) = IUniswapV2Pair(
            underlyingAsset
        ).getReserves();
        uint256 K = _reserve0 * _reserve1;
        require(K > KLIMIT, "invalid pair");

        IAaveOracle oracle = IAaveOracle(ADDRESSES_PROVIDER.getPriceOracle());
        uint256 token0Price = oracle.getAssetPrice(token0);
        uint256 token1Price = oracle.getAssetPrice(token1);
        uint256 poolValue = SqrtLib.sqrt(
            (K * token0Price * token1Price) /
                10 ** token0Decimal /
                10 ** token1Decimal
        ) * 2;

        uint256 totalSupply = IERC20(underlyingAsset).totalSupply();
        uint256 price = (poolValue * 1e18) / totalSupply;

        return price.toInt256();
    }
}
