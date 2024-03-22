import { task } from "hardhat/config";
import { getGasRefund, getPool, Yield_GAS_Controller } from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-yield-gas-controller`, `deploy yield and gas controller`)
  .addParam("aWETH", "aWETH contract address")
  .addParam("aUSDB", "aUSDB contract address")
  .setAction(async ({ aWETH, aUSDB }, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    const pool = await getPool();
    const gasRefund = await getGasRefund();

    console.log("- Deployment of YieldGasController contract");
    const YieldGasController = await deploy(Yield_GAS_Controller, {
      from: deployer,
      contract: "YieldGasController",
      args: [pool.address, gasRefund.address, aWETH, aUSDB],
      ...COMMON_DEPLOY_PARAMS,
    });

    console.log("YieldGasController deployed at:", YieldGasController.address);
  });
