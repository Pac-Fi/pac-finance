import { eParallelNetwork, IAaveConfiguration } from "../../helpers/types";
import { strategyUSDC, strategyWBTC, strategyWETH } from "./reservesConfigs";
import { CommonsConfig } from "../aave/commons";
// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const ParallelMarket: IAaveConfiguration = {
  ...CommonsConfig,
  ProviderId: 30,
  WrappedNativeTokenSymbol: "WETH",
  MarketId: "Parallel Aave Market",
  ATokenNamePrefix: "Parallel",
  StableDebtTokenNamePrefix: "Parallel",
  VariableDebtTokenNamePrefix: "Parallel",
  OracleQuoteCurrency: "USD",
  OracleQuoteUnit: "8",
  SymbolPrefix: "",
  ReservesConfig: {
    USDC: strategyUSDC,
    WBTC: strategyWBTC,
    WETH: strategyWETH,
  },
  ReserveAssets: {
    [eParallelNetwork.devL2]: {
      USDC: "0xc3E1C28993B9973995E4a72CbA706321066A7cbF",
      WBTC: "0x86A291c4CFDF593B3b784347FEeBC2Ffc6F710eF",
      WETH: "0x1E48dfD798560Ba47cb061fd6531C0bEa97C9459",
    },
  },
  ChainlinkAggregator: {
    [eParallelNetwork.devL2]: {
      USDC: "0x9af637009b1E393e862aCC6803f2866441270976",
      WBTC: "0x755B7cFCf7BD45d845A2d3e43176e9038e6d554E",
      WETH: "0x1019Be98D5f2A566179d5AF32bcdeE30e11A72C6",
    },
  },
};

export default ParallelMarket;
