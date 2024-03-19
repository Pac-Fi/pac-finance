import {
  DETERMINISTIC_DEPLOYMENT,
  DETERMINISTIC_FACTORIES,
  getCommonNetworkConfig,
  hardhatNetworkSettings,
  loadTasks,
} from "./helpers/hardhat-config-helpers";
import {
  eArbitrumNetwork,
  eAvalancheNetwork,
  eEthereumNetwork,
  eFantomNetwork,
  eHarmonyNetwork,
  eOptimismNetwork,
  eParallelNetwork,
  eMantaNetwork,
  eBlastNetwork,
  ePolygonNetwork,
} from "./helpers/types";
import { DEFAULT_NAMED_ACCOUNTS } from "./helpers/constants";

import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "hardhat-contract-sizer";
import "hardhat-dependency-compiler";
import "@nomicfoundation/hardhat-chai-matchers";

const SKIP_LOAD = process.env.SKIP_LOAD === "true";
const TASK_FOLDERS = ["misc", "market-registry"];

// Prevent to load tasks before compilation and typechain
if (!SKIP_LOAD) {
  loadTasks(TASK_FOLDERS);
}

export default {
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: { enabled: true, runs: 100_000 },
          evmVersion: "berlin",
        },
      },
      {
        version: "0.7.5",
        settings: {
          optimizer: { enabled: true, runs: 100_000 },
        },
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  networks: {
    hardhat: hardhatNetworkSettings,
    localhost: {
      url: "http://127.0.0.1:8545",
      ...hardhatNetworkSettings,
    },
    tenderly: getCommonNetworkConfig("tenderly", 3030),
    main: getCommonNetworkConfig(eEthereumNetwork.main, 1),
    kovan: getCommonNetworkConfig(eEthereumNetwork.kovan, 42),
    rinkeby: getCommonNetworkConfig(eEthereumNetwork.rinkeby, 4),
    ropsten: getCommonNetworkConfig(eEthereumNetwork.ropsten, 3),
    [ePolygonNetwork.polygon]: getCommonNetworkConfig(
      ePolygonNetwork.polygon,
      137
    ),
    [ePolygonNetwork.mumbai]: getCommonNetworkConfig(
      ePolygonNetwork.mumbai,
      80001
    ),
    arbitrum: getCommonNetworkConfig(eArbitrumNetwork.arbitrum, 42161),
    [eArbitrumNetwork.arbitrumTestnet]: getCommonNetworkConfig(
      eArbitrumNetwork.arbitrumTestnet,
      421611
    ),
    [eHarmonyNetwork.main]: getCommonNetworkConfig(
      eHarmonyNetwork.main,
      1666600000
    ),
    [eHarmonyNetwork.testnet]: getCommonNetworkConfig(
      eHarmonyNetwork.testnet,
      1666700000
    ),
    [eAvalancheNetwork.avalanche]: getCommonNetworkConfig(
      eAvalancheNetwork.avalanche,
      43114
    ),
    [eAvalancheNetwork.fuji]: getCommonNetworkConfig(
      eAvalancheNetwork.fuji,
      43113
    ),
    [eFantomNetwork.main]: getCommonNetworkConfig(eFantomNetwork.main, 250),
    [eFantomNetwork.testnet]: getCommonNetworkConfig(
      eFantomNetwork.testnet,
      4002
    ),
    [eOptimismNetwork.testnet]: getCommonNetworkConfig(
      eOptimismNetwork.testnet,
      420
    ),
    [eOptimismNetwork.main]: getCommonNetworkConfig(eOptimismNetwork.main, 10),
    [eEthereumNetwork.goerli]: getCommonNetworkConfig(
      eEthereumNetwork.goerli,
      5
    ),
    [eEthereumNetwork.sepolia]: getCommonNetworkConfig(
      eEthereumNetwork.sepolia,
      11155111
    ),
    [eArbitrumNetwork.goerliNitro]: getCommonNetworkConfig(
      eArbitrumNetwork.goerliNitro,
      421613
    ),
    [eParallelNetwork.mainnet]: getCommonNetworkConfig(
      eParallelNetwork.mainnet,
      1024
    ),
    [eParallelNetwork.devL2]: getCommonNetworkConfig(
      eParallelNetwork.devL2,
      9659
    ),
    [eMantaNetwork.main]: getCommonNetworkConfig(eMantaNetwork.main, 169),
    [eMantaNetwork.testnet]: getCommonNetworkConfig(
      eMantaNetwork.testnet,
      3441005
    ),
    [eBlastNetwork.main]: getCommonNetworkConfig(eBlastNetwork.main, 81457),
    [eBlastNetwork.testnet]: getCommonNetworkConfig(
      eBlastNetwork.testnet,
      168587773
    ),
  },
  namedAccounts: {
    ...DEFAULT_NAMED_ACCOUNTS,
  },
  mocha: {
    timeout: 0,
  },
  dependencyCompiler: {
    paths: [
      "contracts/core-v3/contracts/protocol/configuration/PoolAddressesProviderRegistry.sol",
      "contracts/core-v3/contracts/protocol/configuration/PoolAddressesProvider.sol",
      "contracts/core-v3/contracts/misc/AaveOracle.sol",
      "contracts/core-v3/contracts/protocol/tokenization/AToken.sol",
      "contracts/core-v3/contracts/protocol/tokenization/DelegationAwareAToken.sol",
      "contracts/core-v3/contracts/protocol/tokenization/StableDebtToken.sol",
      "contracts/core-v3/contracts/protocol/tokenization/VariableDebtToken.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/GenericLogic.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/ValidationLogic.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/ReserveLogic.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/SupplyLogic.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/EModeLogic.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/BorrowLogic.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/BridgeLogic.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/FlashLoanLogic.sol",
      "contracts/core-v3/contracts/protocol/libraries/logic/CalldataLogic.sol",
      "contracts/core-v3/contracts/protocol/pool/Pool.sol",
      "contracts/core-v3/contracts/protocol/pool/L2Pool.sol",
      "contracts/core-v3/contracts/protocol/pool/PoolConfigurator.sol",
      "contracts/core-v3/contracts/protocol/pool/DefaultReserveInterestRateStrategy.sol",
      "contracts/core-v3/contracts/protocol/libraries/aave-upgradeability/InitializableImmutableAdminUpgradeabilityProxy.sol",
      "contracts/core-v3/contracts/dependencies/openzeppelin/upgradeability/InitializableAdminUpgradeabilityProxy.sol",
      "contracts/core-v3/contracts/deployments/ReservesSetupHelper.sol",
      "contracts/core-v3/contracts/misc/AaveProtocolDataProvider.sol",
      "contracts/core-v3/contracts/misc/L2Encoder.sol",
      "contracts/core-v3/contracts/protocol/configuration/ACLManager.sol",
      "contracts/core-v3/contracts/dependencies/weth/WETH9.sol",
      "contracts/core-v3/contracts/mocks/helpers/MockIncentivesController.sol",
      "contracts/core-v3/contracts/mocks/helpers/MockReserveConfiguration.sol",
      "contracts/core-v3/contracts/mocks/oracle/CLAggregators/MockAggregator.sol",
      "contracts/core-v3/contracts/mocks/tokens/MintableERC20.sol",
      "contracts/core-v3/contracts/mocks/flashloan/MockFlashLoanReceiver.sol",
      "contracts/core-v3/contracts/mocks/tokens/WETH9Mocked.sol",
      "contracts/core-v3/contracts/mocks/upgradeability/MockVariableDebtToken.sol",
      "contracts/core-v3/contracts/mocks/upgradeability/MockAToken.sol",
      "contracts/core-v3/contracts/mocks/upgradeability/MockStableDebtToken.sol",
      "contracts/core-v3/contracts/mocks/upgradeability/MockInitializableImplementation.sol",
      "contracts/core-v3/contracts/mocks/helpers/MockPool.sol",
      "contracts/core-v3/contracts/mocks/helpers/MockL2Pool.sol",
      "contracts/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20Detailed.sol",
      "contracts/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol",
      "contracts/core-v3/contracts/mocks/oracle/PriceOracle.sol",
      "contracts/core-v3/contracts/mocks/tokens/MintableDelegationERC20.sol",
      "contracts/periphery-v3/contracts/misc/UiPoolDataProviderV3.sol",
      "contracts/periphery-v3/contracts/misc/WalletBalanceProvider.sol",
      "contracts/periphery-v3/contracts/misc/WrappedTokenGatewayV3.sol",
      "contracts/periphery-v3/contracts/misc/interfaces/IWETH.sol",
      "contracts/periphery-v3/contracts/misc/UiIncentiveDataProviderV3.sol",
      "contracts/periphery-v3/contracts/rewards/RewardsController.sol",
      // tslint:disable-next-line:max-line-length
      "contracts/periphery-v3/contracts/rewards/transfer-strategies/StakedTokenTransferStrategy.sol",
      // tslint:disable-next-line:max-line-length
      "contracts/periphery-v3/contracts/rewards/transfer-strategies/PullRewardsTransferStrategy.sol",
      "contracts/periphery-v3/contracts/rewards/EmissionManager.sol",
      "contracts/periphery-v3/contracts/mocks/WETH9Mock.sol",
      "contracts/periphery-v3/contracts/mocks/testnet-helpers/Faucet.sol",
      "contracts/periphery-v3/contracts/mocks/testnet-helpers/TestnetERC20.sol",
      "contracts/periphery-v3/contracts/treasury/Collector.sol",
      "contracts/periphery-v3/contracts/treasury/CollectorController.sol",
      "contracts/periphery-v3/contracts/treasury/AaveEcosystemReserveV2.sol",
      "contracts/periphery-v3/contracts/treasury/AaveEcosystemReserveController.sol",
      "@aave/safety-module/contracts/stake/StakedAave.sol",
      "@aave/safety-module/contracts/stake/StakedAaveV2.sol",
      "@aave/safety-module/contracts/proposals/extend-stkaave-distribution/StakedTokenV2Rev3.sol",
    ],
  },
  deterministicDeployment: DETERMINISTIC_DEPLOYMENT
    ? DETERMINISTIC_FACTORIES
    : undefined,
  etherscan: {
    apiKey: {
      [eBlastNetwork.testnet]: "A95CR6XKY1YCB6PCDJ5WXW9FQ99FB5WYR1",
      [eBlastNetwork.main]: "A95CR6XKY1YCB6PCDJ5WXW9FQ99FB5WYR1",
    },
    customChains: [
      {
        network: [eBlastNetwork.testnet],
        chainId: 168587773,
        urls: {
          apiURL:
            "https://api.routescan.io/v2/network/testnet/evm/168587773/etherscan",
          browserURL: "https://testnet.blastscan.io",
        },
      },
      {
        network: "blast",
        chainId: 81457,
        urls: {
          //https://docs.blastscan.io/api-endpoints/contracts#verify-source-code
          apiURL: "https://api.blastscan.io/api",
          browserURL: "https://blastscan.io",
        },
      },
    ],
  },
};
