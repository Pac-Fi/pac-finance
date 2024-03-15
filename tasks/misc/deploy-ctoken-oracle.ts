import { task } from "hardhat/config";
import { CToken_Price_Oracle_Wrapper } from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-ctoken-oracle`, `deploy ctoken oracle`)
  .addParam("underlyingOracle", "ctoken underlying asset oracle")
  .addParam("ctoken", "ctoken contract address")
  .setAction(async ({ underlyingOracle, ctoken }, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    console.log("- Deployment of ExchangeRateAssetPriceAdapter contract");
    const CLFixedPriceSynchronicityPriceAdapter = await deploy(
      CToken_Price_Oracle_Wrapper,
      {
        from: deployer,
        contract: "ExchangeRateAssetPriceAdapter",
        args: [underlyingOracle, ctoken, "8"],
        ...COMMON_DEPLOY_PARAMS,
      }
    );

    console.log(
      "CLFixedPriceSynchronicityPriceAdapter deployed at:",
      CLFixedPriceSynchronicityPriceAdapter.address
    );
  });
