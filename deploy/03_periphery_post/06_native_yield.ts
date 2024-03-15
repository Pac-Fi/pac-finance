import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { COMMON_DEPLOY_PARAMS, MARKET_NAME } from "../../helpers/env";
import {
  ConfigNames,
  eNetwork,
  getPool,
  loadPoolConfig,
  waitForTx,
  NativeYieldDistribute,
  IReserveParams,
  getReserveAddresses,
  getAToken,
  Native_Yield_Distribute_IMPL,
  Native_Yield_Distribute_Proxy,
  getContract,
  InitializableAdminUpgradeabilityProxy,
  NativeYieldDistribute__factory, getBlastContractAddress,
} from "../../helpers";

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
  const { ReservesConfig } = poolConfig;
  const reservesAddresses = await getReserveAddresses(poolConfig, network);

  const blastAddress = getBlastContractAddress(hre.network.name);
  const distributeContract = await deploy(Native_Yield_Distribute_IMPL, {
    from: deployer,
    contract: "NativeYieldDistribute",
    args: [blastAddress],
    ...COMMON_DEPLOY_PARAMS,
  });
  console.log(
    "NativeYieldDistribute impl deployed at:",
    distributeContract.address
  );

  for (const [assetSymbol, { nativeYield }] of Object.entries(
    ReservesConfig
  ) as [string, IReserveParams][]) {
    if (!nativeYield) {
      console.log(`skip deploy NativeYieldDistribute for ${assetSymbol}`);
    }
    const { aTokenAddress } = await poolProxy.getReserveData(
      reservesAddresses[assetSymbol]
    );

    console.log("- Deployment of NativeYieldDistribute proxy for", assetSymbol);
    const initData =
      NativeYieldDistribute__factory.createInterface().encodeFunctionData(
        "initialize",
        [aTokenAddress, reservesAddresses[assetSymbol]]
      );

    const distributeContractProxy = await deploy(
      Native_Yield_Distribute_Proxy + assetSymbol,
      {
        from: deployer,
        contract: "InitializableAdminUpgradeabilityProxy",
        args: [],
        ...COMMON_DEPLOY_PARAMS,
      }
    );

    console.log(
      "NativeYieldDistribute proxy deployed at:",
      distributeContractProxy.address
    );

    const proxyInstance = (await getContract(
      "InitializableAdminUpgradeabilityProxy",
      distributeContractProxy.address
    )) as InitializableAdminUpgradeabilityProxy;

    await waitForTx(
      await proxyInstance["initialize(address,address,bytes)"](
        distributeContract.address,
        poolConfig.upgradeAdmin!,
        initData
      )
    );

    const aTokenInstance = await getAToken(aTokenAddress);
    await waitForTx(
      await aTokenInstance.setYieldDistributor(distributeContractProxy.address)
    );
  }
};

func.tags = ["periphery-post"];

export default func;
