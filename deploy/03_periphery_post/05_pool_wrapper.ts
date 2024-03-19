import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { COMMON_DEPLOY_PARAMS, MARKET_NAME } from "../../helpers/env";
import { WRAPPED_NATIVE_TOKEN_PER_NETWORK } from "../../helpers/constants";
import {
  ConfigNames,
  eNetwork,
  getPool,
  isTestnetMarket,
  PAC_POOL_WRAPPER,
  loadPoolConfig,
  TESTNET_TOKEN_PREFIX,
  PacPoolWrapper,
  waitForTx,
  GAS_REFUND_IMPL,
  GAS_REFUND_PROXY,
  GasRefund__factory,
  getContract,
  Native_Yield_Distribute_Proxy,
  InitializableAdminUpgradeabilityProxy,
  getBlastContractAddress,
} from "../../helpers";
import { ethers } from "hardhat";

const func: DeployFunction = async function ({
  getNamedAccounts,
  deployments,
  ...hre
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const network = (
    process.env.FORK ? process.env.FORK : hre.network.name
  ) as eNetwork;

  const poolProxy = await getPool();
  const poolConfig = loadPoolConfig(MARKET_NAME as ConfigNames);

  let wrappedNativeTokenAddress;

  // Local networks that are not live or testnet, like hardhat network,
  // will deploy a WETH9 contract as mockup for testing deployments
  if (isTestnetMarket(poolConfig)) {
    wrappedNativeTokenAddress = (
      await deployments.get(
        `${poolConfig.WrappedNativeTokenSymbol}${TESTNET_TOKEN_PREFIX}`
      )
    ).address;
  } else {
    if (!WRAPPED_NATIVE_TOKEN_PER_NETWORK[network]) {
      throw `Missing Wrapped native token for network: ${network}, fill the missing configuration at ./helpers/constants.ts`;
    }
    wrappedNativeTokenAddress = WRAPPED_NATIVE_TOKEN_PER_NETWORK[network];
  }

  const LeverageDepositor = await deploy(PAC_POOL_WRAPPER, {
    from: deployer,
    contract: "PacPoolWrapper",
    args: [poolProxy.address, wrappedNativeTokenAddress],
    ...COMMON_DEPLOY_PARAMS,
  });

  console.log("PacPoolWrapper deployed at:", LeverageDepositor.address);

  const blastAddress = getBlastContractAddress(hre.network.name);
  const gasRefund = await deploy(GAS_REFUND_IMPL, {
    from: deployer,
    contract: "GasRefund",
    args: [LeverageDepositor.address, blastAddress],
    ...COMMON_DEPLOY_PARAMS,
  });
  console.log("gasRefund IMPL deployed at:", gasRefund.address);

  const initData =
    GasRefund__factory.createInterface().encodeFunctionData("initialize");

  const gasRefundProxy = await deploy(GAS_REFUND_PROXY, {
    from: deployer,
    contract: "InitializableAdminUpgradeabilityProxy",
    args: [],
    ...COMMON_DEPLOY_PARAMS,
  });
  console.log("gasRefundProxy deployed at:", gasRefundProxy.address);

  const proxyInstance = (await getContract(
    "InitializableAdminUpgradeabilityProxy",
    gasRefundProxy.address
  )) as InitializableAdminUpgradeabilityProxy;
  await waitForTx(
    await proxyInstance["initialize(address,address,bytes)"](
      gasRefund.address,
      poolConfig.upgradeAdmin!,
      initData
    )
  );

  const poolWrapper = (await ethers.getContractAt(
    LeverageDepositor.abi,
    LeverageDepositor.address
  )) as PacPoolWrapper;

  await waitForTx(await poolWrapper.setGasRefund(gasRefundProxy.address));
};

func.tags = ["periphery-post"];

export default func;
