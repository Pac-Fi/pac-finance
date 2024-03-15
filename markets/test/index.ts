import {
  rateStrategyStableOne,
  rateStrategyStableTwo,
  rateStrategyVolatileOne,
} from "./rateStrategies";
import { eBlastNetwork, ZERO_ADDRESS } from "../../helpers";
import {
  IAaveConfiguration,
  eEthereumNetwork,
  eArbitrumNetwork,
} from "../../helpers/types";

import { CommonsConfig } from "./commons";
import { strategyUSDC, strategyWETH } from "./reservesConfigs";

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const AaveMarket: IAaveConfiguration = {
  ...CommonsConfig,
  MarketId: "Testnet Aave Market",
  ProviderId: 8080,
  ReservesConfig: {
    WETH: strategyWETH,
    USDC: strategyUSDC,
  },
  ReserveAssets: {},
  upgradeAdmin: "0xf2B18c20Ed5E5a6ABB15377D619C1879639339AD",
};

export default AaveMarket;
