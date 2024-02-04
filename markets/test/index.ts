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
import { strategyWETH } from "./reservesConfigs";

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const AaveMarket: IAaveConfiguration = {
  ...CommonsConfig,
  MarketId: "Testnet Aave Market",
  ProviderId: 8080,
  ReservesConfig: {
    WETH: strategyWETH,
  },
  ReserveAssets: {},
};

export default AaveMarket;
