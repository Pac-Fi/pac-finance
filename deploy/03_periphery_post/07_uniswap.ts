import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { COMMON_DEPLOY_PARAMS, MARKET_NAME } from "../../helpers/env";
import {
  ConfigNames,
  eNetwork,
  loadPoolConfig,
  eEthereumNetwork,
  UniswapV2Factory,
  UniswapV2Router02,
  TESTNET_TOKEN_PREFIX,
  UniswapV2_Factory,
  UniswapV2_Router02,
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

  if (network === eEthereumNetwork.hardhat) {
    const FactoryContract = await deploy(UniswapV2_Factory, {
      from: deployer,
      contract: "UniswapV2Factory",
      args: [deployer],
      ...COMMON_DEPLOY_PARAMS,
    });

    console.log("UniswapV2Factory deployed at:", FactoryContract.address);

    const poolConfig = loadPoolConfig(MARKET_NAME as ConfigNames);
    const wrappedNativeTokenAddress = (
      await deployments.get(
        `${poolConfig.WrappedNativeTokenSymbol}${TESTNET_TOKEN_PREFIX}`
      )
    ).address;
    const RouterContract = await deploy(UniswapV2_Router02, {
      from: deployer,
      contract: "UniswapV2Router02",
      args: [FactoryContract.address, wrappedNativeTokenAddress],
      ...COMMON_DEPLOY_PARAMS,
    });

    console.log("UniswapV2Router02 deployed at:", RouterContract.address);
  }
};

func.tags = ["periphery-post"];

export default func;
