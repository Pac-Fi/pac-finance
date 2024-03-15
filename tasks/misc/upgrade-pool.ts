import { task } from "hardhat/config";
import {
  getBlastContractAddress,
  getPoolAddressesProvider,
  getPoolLibraries,
  POOL_IMPL_ID,
  waitForTx,
} from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`update-pool-impl`, `update pool implementation`).setAction(
  async (_, hre) => {
    if (!hre.network.config.chainId) {
      throw new Error("INVALID_CHAIN_ID");
    }

    const { deployer } = await hre.getNamedAccounts();

    const addressProvider = await getPoolAddressesProvider();
    const blastAddress = getBlastContractAddress(hre.network.name);
    const commonLibraries = await getPoolLibraries();

    // Deploy common Pool contract
    const poolArtifact = await hre.deployments.deploy(POOL_IMPL_ID, {
      contract: "Pool",
      from: deployer,
      args: [addressProvider.address, blastAddress],
      libraries: {
        ...commonLibraries,
      },
      ...COMMON_DEPLOY_PARAMS,
    });

    await waitForTx(await addressProvider.setPoolImpl(poolArtifact.address));

    console.log(`\tFinished Pool Impl Upgrade`);
  }
);
