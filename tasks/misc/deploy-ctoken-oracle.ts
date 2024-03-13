import { task } from "hardhat/config";
import {
  CToken_Price_Oracle_Wrapper,
} from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-ctoken-oracle`, `deploy ctoken oracle`)
  .addParam(
    "underlyingOracle",
    "ctoken underlying asset oracle",
    "0x1a8476F94F5d1351a3BE93b2A2437f750f9343d9"
  )
  .addParam(
    "ctoken",
    "ctoken contract address",
    "0xF9B3B455f5d900f62bC1792A6Ca6e1d47B989389"
  )
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
