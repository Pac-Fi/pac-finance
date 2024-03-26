import { task } from "hardhat/config";
import { EZETH_ORACLE } from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-ezeth-oracle`, `deploy ezeth oracle wrapper`)
  .addParam(
    "ethProxy",
    "The address of the eth proxy",
    "0x009E9B1eec955E9Fe7FE64f80aE868e661cb4729"
  )
  .addParam(
    "exchangeRateProxy",
    "The address of the exchange rate proxy",
    "0x28c1576eb118f2Ccd02eF2e6Dbd732F5C8D2e86B"
  )
  .setAction(async ({ ethProxy, exchangeRateProxy }, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    console.log("- Deployment of ezETHOracle contract");
    const Oracle = await deploy(EZETH_ORACLE, {
      from: deployer,
      contract: "ezETHOracle",
      args: [ethProxy, exchangeRateProxy],
      ...COMMON_DEPLOY_PARAMS,
    });

    console.log("ezETHOracle deployed at:", Oracle.address);
  });
