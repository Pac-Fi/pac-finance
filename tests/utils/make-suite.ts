import {
  ConfigNames,
  isTestnetMarket,
  loadPoolConfig,
} from "./../../helpers/market-config-helpers";
import { Signer } from "ethers";
import { evmRevert, evmSnapshot } from "../../helpers/utilities/tx";
import { tEthereumAddress } from "../../helpers/types";
import {
  AaveProtocolDataProvider,
  AToken,
  PoolConfigurator,
  PoolAddressesProvider,
  PoolAddressesProviderRegistry,
  PacPoolWrapper,
  Pool,
  VariableDebtToken,
  WrappedTokenGatewayV3,
  AaveOracle,
  WETH9,
  Faucet,
  GasRefund,
  NativeYieldDistribute,
  UniswapV2Factory,
  UniswapV2Router02,
  MintableERC20,
} from "../../typechain";
import {
  PAC_POOL_WRAPPER,
  ORACLE_ID,
  POOL_ADDRESSES_PROVIDER_ID,
  POOL_CONFIGURATOR_PROXY_ID,
  POOL_DATA_PROVIDER,
  POOL_PROXY_ID,
  GAS_REFUND_PROXY,
  GAS_REFUND_IMPL,
  Native_Yield_Distribute_IMPL,
  UniswapV2_Factory,
  UniswapV2_Router02,
} from "../../helpers/deploy-ids";
import {
  getAToken,
  getFaucet,
  getVariableDebtToken,
  getMintableERC20,
  getWETH,
} from "../../helpers/contract-getters";

import { ethers, deployments } from "hardhat";
import { getEthersSigners } from "../../helpers/utilities/signer";
import { MARKET_NAME } from "../../helpers/env";

export interface SignerWithAddress {
  signer: Signer;
  address: tEthereumAddress;
}
export interface TestEnv {
  deployer: SignerWithAddress;
  poolAdmin: SignerWithAddress;
  emergencyAdmin: SignerWithAddress;
  riskAdmin: SignerWithAddress;
  users: SignerWithAddress[];
  pool: Pool;
  configurator: PoolConfigurator;
  oracle: AaveOracle;
  helpersContract: AaveProtocolDataProvider;
  weth: WETH9;
  aWETH: AToken;
  debtWETH: VariableDebtToken;
  usdc: MintableERC20;
  aUsdc: AToken;
  debtUsdc: VariableDebtToken;
  addressesProvider: PoolAddressesProvider;
  registry: PoolAddressesProviderRegistry;
  wrappedTokenGateway: WrappedTokenGatewayV3;
  faucetOwnable: Faucet;
  poolWrapper: PacPoolWrapper;
  gasRefund: GasRefund;
  wethYieldDistribute: NativeYieldDistribute;
  uniswapFactory: UniswapV2Factory;
  uniswapRouter: UniswapV2Router02;
}

let HardhatSnapshotId: string = "0x1";
const setHardhatSnapshotId = (id: string) => {
  HardhatSnapshotId = id;
};

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  poolAdmin: {} as SignerWithAddress,
  emergencyAdmin: {} as SignerWithAddress,
  riskAdmin: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  pool: {} as Pool,
  configurator: {} as PoolConfigurator,
  helpersContract: {} as AaveProtocolDataProvider,
  oracle: {} as AaveOracle,
  weth: {} as WETH9,
  aWETH: {} as AToken,
  debtWETH: {} as VariableDebtToken,
  usdc: {} as MintableERC20,
  aUsdc: {} as AToken,
  debtUsdc: {} as VariableDebtToken,
  addressesProvider: {} as PoolAddressesProvider,
  registry: {} as PoolAddressesProviderRegistry,
  wrappedTokenGateway: {} as WrappedTokenGatewayV3,
  faucetOwnable: {} as Faucet,
  poolWrapper: {} as PacPoolWrapper,
  gasRefund: {} as GasRefund,
  wethYieldDistribute: {} as NativeYieldDistribute,
  uniswapFactory: {} as UniswapV2Factory,
  uniswapRouter: {} as UniswapV2Router02,
} as TestEnv;

export async function initializeMakeSuite() {
  const poolConfig = await loadPoolConfig(MARKET_NAME as ConfigNames);

  const [_deployer, ...restSigners] = await getEthersSigners();
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };

  for (const signer of restSigners) {
    testEnv.users.push({
      signer,
      address: await signer.getAddress(),
    });
  }

  const wrappedTokenGatewayArtifact = await deployments.get(
    "WrappedTokenGatewayV3"
  );
  const poolArtifact = await deployments.get(POOL_PROXY_ID);
  const configuratorArtifact = await deployments.get(
    POOL_CONFIGURATOR_PROXY_ID
  );
  const addressesProviderArtifact = await deployments.get(
    POOL_ADDRESSES_PROVIDER_ID
  );
  const addressesProviderRegistryArtifact = await deployments.get(
    "PoolAddressesProviderRegistry"
  );
  const priceOracleArtifact = await deployments.get(ORACLE_ID);
  const dataProviderArtifact = await deployments.get(POOL_DATA_PROVIDER);

  testEnv.deployer = deployer;
  testEnv.poolAdmin = deployer;
  testEnv.emergencyAdmin = testEnv.users[1];
  testEnv.riskAdmin = testEnv.users[2];
  testEnv.wrappedTokenGateway = (await ethers.getContractAt(
    "WrappedTokenGatewayV3",
    wrappedTokenGatewayArtifact.address
  )) as WrappedTokenGatewayV3;
  testEnv.pool = (await ethers.getContractAt(
    "Pool",
    poolArtifact.address
  )) as Pool;

  testEnv.configurator = (await ethers.getContractAt(
    "PoolConfigurator",
    configuratorArtifact.address
  )) as PoolConfigurator;

  testEnv.addressesProvider = (await ethers.getContractAt(
    "PoolAddressesProvider",
    addressesProviderArtifact.address
  )) as PoolAddressesProvider;

  testEnv.registry = (await ethers.getContractAt(
    "PoolAddressesProviderRegistry",
    addressesProviderRegistryArtifact.address
  )) as PoolAddressesProviderRegistry;
  testEnv.oracle = (await ethers.getContractAt(
    "AaveOracle",
    priceOracleArtifact.address
  )) as AaveOracle;

  testEnv.helpersContract = (await ethers.getContractAt(
    dataProviderArtifact.abi,
    dataProviderArtifact.address
  )) as AaveProtocolDataProvider;

  const allTokens = await testEnv.helpersContract.getAllATokens();
  const aWEthAddress = allTokens.find(
    (aToken) => aToken.symbol === "aTestWETH"
  )?.tokenAddress;

  const reservesTokens = await testEnv.helpersContract.getAllReservesTokens();
  const wethAddress = reservesTokens.find(
    (token) => token.symbol === "WETH"
  )?.tokenAddress;
  const { variableDebtTokenAddress: variableDebtAddress } =
    await testEnv.helpersContract.getReserveTokensAddresses(wethAddress!);
  testEnv.aWETH = await getAToken(aWEthAddress!);
  testEnv.weth = await getWETH(wethAddress!);
  testEnv.debtWETH = await getVariableDebtToken(variableDebtAddress);

  const usdcAddress = reservesTokens.find(
      (token) => token.symbol === "USDC"
  )?.tokenAddress;
  const aUsdcAddress = allTokens.find(
      (aToken) => aToken.symbol === "aTestUSDC"
  )?.tokenAddress;
  const { variableDebtTokenAddress: usdcVariableDebtAddress } =
      await testEnv.helpersContract.getReserveTokensAddresses(usdcAddress!);
  testEnv.aUsdc = await getAToken(aUsdcAddress!);
  testEnv.usdc = await getMintableERC20(usdcAddress!);
  testEnv.debtUsdc = await getVariableDebtToken(usdcVariableDebtAddress);

  const poolWrapper = await deployments.get(PAC_POOL_WRAPPER);
  testEnv.poolWrapper = (await ethers.getContractAt(
    poolWrapper.abi,
    poolWrapper.address
  )) as PacPoolWrapper;

  const gasRefundProxy = await deployments.get(GAS_REFUND_PROXY);
  const gasRefund = await deployments.get(GAS_REFUND_IMPL);
  testEnv.gasRefund = (await ethers.getContractAt(
    gasRefund.abi,
    gasRefundProxy.address
  )) as GasRefund;

  const yieldDistribute = await deployments.get(Native_Yield_Distribute_IMPL);
  const yieldAddress = await testEnv.aWETH.yieldDistributor();
  testEnv.wethYieldDistribute = (await ethers.getContractAt(
    yieldDistribute.abi,
    yieldAddress
  )) as NativeYieldDistribute;

  const uniswapFactory = await deployments.get(UniswapV2_Factory);
  testEnv.uniswapFactory = (await ethers.getContractAt(
    uniswapFactory.abi,
    uniswapFactory.address
  )) as UniswapV2Factory;

  const uniswapRouter = await deployments.get(UniswapV2_Router02);
  testEnv.uniswapRouter = (await ethers.getContractAt(
    uniswapRouter.abi,
    uniswapRouter.address
  )) as UniswapV2Router02;

  if (isTestnetMarket(poolConfig)) {
    testEnv.faucetOwnable = await getFaucet();
  }
}

const setSnapshot = async () => {
  setHardhatSnapshotId(await evmSnapshot());
};

const revertHead = async () => {
  await evmRevert(HardhatSnapshotId);
};

export function makeSuite(name: string, tests: (testEnv: TestEnv) => void) {
  describe(name, () => {
    before(async () => {
      await setSnapshot();
    });
    tests(testEnv);
    after(async () => {
      await revertHead();
    });
  });
}
