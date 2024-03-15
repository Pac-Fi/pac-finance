import { task } from "hardhat/config";
import { getAToken, Native_Yield_Distribute_IMPL } from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-yield-distributor`, `deploy yield distributor for aToken`)
  .addParam("aToken", "atoken address")
  .setAction(async ({ aToken }, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    const aTokenInstance = await getAToken(aToken);
    const underlyingToken = await aTokenInstance.UNDERLYING_ASSET_ADDRESS();

    console.log("- Deployment of NativeYieldDistribute contract");
    const distributeContract = await deploy(Native_Yield_Distribute_IMPL, {
      from: deployer,
      contract: "NativeYieldDistribute",
      args: [aToken, underlyingToken],
      ...COMMON_DEPLOY_PARAMS,
    });

    console.log(
      "NativeYieldDistribute deployed at:",
      distributeContract.address
    );

    await aTokenInstance.setYieldDistributor(distributeContract.address);
  });
