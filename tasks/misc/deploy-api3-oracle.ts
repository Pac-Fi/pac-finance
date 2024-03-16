import { task } from "hardhat/config";
import { API3_Oracle_Wrapper, ERC20_Oracle_Wrapper } from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-api3-oracle`, `deploy erc20 oracle wrapper for pyth`)
  .addParam("api3", "The address of the api3 proxy")
  .setAction(async ({ api3 }, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    console.log("- Deployment of API3OracleWrapper contract");
    const API3OracleWrapper = await deploy(API3_Oracle_Wrapper, {
      from: deployer,
      contract: "API3OracleWrapper",
      args: [api3],
      ...COMMON_DEPLOY_PARAMS,
    });

    console.log("API3OracleWrapper deployed at:", API3OracleWrapper.address);
  });
