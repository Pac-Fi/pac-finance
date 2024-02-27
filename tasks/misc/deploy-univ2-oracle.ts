import { task } from "hardhat/config";
import {
  deployUniswapV2OracleWrapper,
  POOL_ADDRESSES_PROVIDER_ID,
} from "../../helpers";

task(`deploy-univ2-oracle`, `deploy oracle for uniswap v2 lp token`)
  .addParam("lptoken", "The address of the lp token")
  .setAction(async ({ lptoken }, hre) => {
    const addressProviderArtifact = await hre.deployments.get(
      POOL_ADDRESSES_PROVIDER_ID
    );

    await deployUniswapV2OracleWrapper(
      lptoken,
      addressProviderArtifact.address
    );

    hre.deployments.log(`[Deployment] Configured all reserves`);
  });
