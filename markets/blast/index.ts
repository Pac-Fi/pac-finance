import { eBlastNetwork, IAaveConfiguration } from "../../helpers/types";
import {
  strategyEZETH,
  strategyfwUSDB,
  strategyfwWETH,
  strategyOETH,
  strategyOUSDB,
  strategyPUMP,
  strategyRingLPWETHUSDB,
  strategySLPETH,
  strategySLPUSDB,
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
  OracleQuoteCurrency: "USD",
  OracleQuoteUnit: "8",
  SymbolPrefix: "",
  upgradeAdmin: "0xf2B18c20Ed5E5a6ABB15377D619C1879639339AD",
  ReservesConfig: {
    // WETH: strategyWETH,
    // USDB: strategyUSDB,
    // fwWETH: strategyfwWETH,
    // fwUSDB: strategyfwUSDB,
    // RingLPWETHUSDB: strategyRingLPWETHUSDB,
    // oEther: strategyOETH,
    // oUSDB: strategyOUSDB,
    // ezETH: strategyEZETH,
    slpUSDB: strategySLPUSDB,
    slpETH: strategySLPETH,
  },
  ReserveAssets: {
    [eBlastNetwork.main]: {
      WETH: "0x4300000000000000000000000000000000000004",
      USDB: "0x4300000000000000000000000000000000000003",
      fwWETH: "0x66714DB8F3397c767d0A602458B5b4E3C0FE7dd1",
      fwUSDB: "0x866f2C06B83Df2ed7Ca9C2D044940E7CD55a06d6",
      RingLPWETHUSDB: "0x9BE8a40C9cf00fe33fd84EAeDaA5C4fe3f04CbC3",
      oEther: "0x0872b71efc37cb8dde22b2118de3d800427fdba0",
      oUSDB: "0x9aECEdCD6A82d26F2f86D331B17a1C1676442A87",
      ezETH: "0x2416092f143378750bb29b79ed961ab195cceea5",
      slpUSDB: "0x56e0f6DF03883611C9762e78d4091E39aD9c420E",
      slpETH: "0x3D4621fa5ff784dfB2fcDFd5B293224167F239db",
    },
    [eBlastNetwork.testnet]: {
      WETH: "0x4200000000000000000000000000000000000023",
      USDB: "0x4200000000000000000000000000000000000022",
      WBTC: "0x86Bc60123bE72e3A4a1611484feBD2C5818b2A1c",
      PUMP: "0xb55416fbc70142B9b76F0d3D65Eb190493C13F15",
      fwWETH: "0x798dE0520497E28E8eBfF0DF1d791c2E942eA881",
      fwUSDB: "0x4D2c669Cf7DC804641Cd4Dec3CD73daB5575c3Da",
      RingLPWETHUSDB: "0x23cb0155437a331545A555164e297B3EC318c1b1",
      oEther: "0x046e66335FadceE7B065D792eBD4Dd753Bb682Cc",
      oUSDB: "0xe2d411df046ec8CeB01e97ecbF669383d6A716ad",
      ezETH: "0x878e427D1a6949F2e014720e3752ECF041EDc442",
    },
  },
  ChainlinkAggregator: {
    [eBlastNetwork.main]: {
      WETH: "0x7FbFbe6CA0261c8485652F05d8277aCF711D99DB",
      USDB: "0x17f968AC6Ac8c650d889c1179774BB98DBbd4B81",
      fwWETH: "0x7FbFbe6CA0261c8485652F05d8277aCF711D99DB",
      fwUSDB: "0x17f968AC6Ac8c650d889c1179774BB98DBbd4B81",
      RingLPWETHUSDB: "0x741d8B79eeEe07A3452E151341f5458469a95430",
      oEther: "0x48e0b6c0AF2BB1990f0c7d29F157e4A0cb85C40B",
      oUSDB: "0x6996D76d47123D0B7E8ebBC48F6CD728FE4341D7",
      ezETH: "0x7FbFbe6CA0261c8485652F05d8277aCF711D99DB",
      slpUSDB: "0xdAeF9Eee69969C021cB677E2A7f7cA1F51589C97",
      slpETH: "0x9E2e2024F3Dcf7377257FC7F2dE05d39c807186C",
    },
    [eBlastNetwork.testnet]: {
      WETH: "0x73104Ac1Fb5A46E2b57a68c0a4d88ae130Da7e19",
      USDB: "0x03419fa2f2307FBD999320CA519c6A7b3049c7f6",
      WBTC: "0x53eB701775363DEEb096DA00651df4FEbb121492",
      PUMP: "0x753d4EE2e003170aeB9B51f23be4ed2B626aAF1c",
      fwWETH: "0x73104Ac1Fb5A46E2b57a68c0a4d88ae130Da7e19",
      fwUSDB: "0x03419fa2f2307FBD999320CA519c6A7b3049c7f6",
      RingLPWETHUSDB: "0x4f189E510c2BA49fA4cBEB45881fF593333B4487",
      oEther: "0xE48B50Dbe5B17C8f7f401640E4d33336066dAAAE",
      oUSDB: "0x00b90a6805324a11E24EfA8a9021ABf64e31Ffc6",
      ezETH: "0xce2952fd1339C7DA179e263f4bb49D968cE33e76",
    },
  },
};

export default BlastMarket;
