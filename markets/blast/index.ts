import {
  eBlastNetwork,
  IAaveConfiguration,
} from "../../helpers/types";
import {
  strategyfwUSDB,
  strategyfwWETH,
  strategyPUMP,
  strategyRingLPWETHUSDB,
  strategyUSDB,
  strategyWBTC,
  strategyWETH,
} from "./reservesConfigs";
import { CommonsConfig } from "../aave/commons";
// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const BlastMarket: IAaveConfiguration = {
  ...CommonsConfig,
  ProviderId: 30,
  WrappedNativeTokenSymbol: "WETH",
  MarketId: "BLAST Aave Market",
  ATokenNamePrefix: "Parallel",
  StableDebtTokenNamePrefix: "Parallel",
  VariableDebtTokenNamePrefix: "Parallel",
  OracleQuoteCurrency: "ETH",
  OracleQuoteUnit: "8",
  SymbolPrefix: "",
  ReservesConfig: {
    WETH: strategyWETH,
    USDB: strategyUSDB,
    WBTC: strategyWBTC,
    PUMP: strategyPUMP,
    fwWETH: strategyfwWETH,
    fwUSDB: strategyfwUSDB,
    RingLPWETHUSDB: strategyRingLPWETHUSDB,
  },
  ReserveAssets: {
    [eBlastNetwork.main]: {
      WETH: "0x4300000000000000000000000000000000000004",
      USDB: "0x4300000000000000000000000000000000000003",
    },
    [eBlastNetwork.testnet]: {
      WETH: "0x4200000000000000000000000000000000000023",
      USDB: "0x4200000000000000000000000000000000000022",
      WBTC: "0x86Bc60123bE72e3A4a1611484feBD2C5818b2A1c",
      PUMP: "0xb55416fbc70142B9b76F0d3D65Eb190493C13F15",
      fwWETH: "0x798dE0520497E28E8eBfF0DF1d791c2E942eA881",
      fwUSDB: "0x4D2c669Cf7DC804641Cd4Dec3CD73daB5575c3Da",
      RingLPWETHUSDB: "0x23cb0155437a331545A555164e297B3EC318c1b1",
    },
  },
  ChainlinkAggregator: {
    [eBlastNetwork.main]: {
      WETH: "0x1a8476F94F5d1351a3BE93b2A2437f750f9343d9",
      USDB: "0xF04383ecA1D1E2eD99f18ef5cFe21d56fe74b036",
    },
    [eBlastNetwork.testnet]: {
      WETH: "0x73104Ac1Fb5A46E2b57a68c0a4d88ae130Da7e19",
      USDB: "0x03419fa2f2307FBD999320CA519c6A7b3049c7f6",
      WBTC: "0x53eB701775363DEEb096DA00651df4FEbb121492",
      PUMP: "0x753d4EE2e003170aeB9B51f23be4ed2B626aAF1c",
      fwWETH: "0x73104Ac1Fb5A46E2b57a68c0a4d88ae130Da7e19",
      fwUSDB: "0x03419fa2f2307FBD999320CA519c6A7b3049c7f6",
      RingLPWETHUSDB: "0x4f189E510c2BA49fA4cBEB45881fF593333B4487",
    },
  },
};

export default BlastMarket;
