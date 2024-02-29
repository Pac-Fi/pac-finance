import { task } from "hardhat/config";
import { Fixed_Price_Oracle_Wrapper } from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-fixed-price-oracle`, `deploy fixed price oracle`)
  .addParam("price", "price", "100000000")
  .setAction(async ({ price }, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    console.log(
      "- Deployment of CLFixedPriceSynchronicityPriceAdapter contract"
    );
    const CLFixedPriceSynchronicityPriceAdapter = await deploy(
      Fixed_Price_Oracle_Wrapper,
      {
        from: deployer,
        contract: "CLFixedPriceSynchronicityPriceAdapter",
        args: [price],
        ...COMMON_DEPLOY_PARAMS,
      }
    );

    console.log(
      "CLFixedPriceSynchronicityPriceAdapter deployed at:",
      CLFixedPriceSynchronicityPriceAdapter.address
    );
  });
