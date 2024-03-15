import { task } from "hardhat/config";
import { ERC20_Oracle_Wrapper } from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-erc20-oracle-wrapper`, `deploy erc20 oracle wrapper for pyth`)
  .addParam(
    "pyth",
    "The address of the pyth",
    "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729"
  )
  .addParam("feedId", "The asset feed id")
  .addParam("expirationPeriod", "The expiration period", "86400")
  .setAction(async ({ pyth, feedId, expirationPeriod }, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    console.log("- Deployment of ERC20OracleWrapper contract");
    const ERC20OracleWrapper = await deploy(ERC20_Oracle_Wrapper, {
      from: deployer,
      contract: "ERC20OracleWrapper",
      args: [pyth, feedId, expirationPeriod, "8"],
      ...COMMON_DEPLOY_PARAMS,
    });

    console.log("ERC20OracleWrapper deployed at:", ERC20OracleWrapper.address);
  });
