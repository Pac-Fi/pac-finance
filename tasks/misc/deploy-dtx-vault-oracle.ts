import { task } from "hardhat/config";
import { DTX_Vault_Oracle } from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-dtx-vault-oracle`, `deploy ctoken oracle`)
  .addParam("underlyingOracle", "dtx vault underlying asset oracle")
  .addParam("vault", "dtx vault contract address")
  .setAction(async ({ underlyingOracle, vault }, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    console.log("- Deployment of DTXVaultOracle contract");
    const DTXVaultOracle = await deploy(DTX_Vault_Oracle, {
      from: deployer,
      contract: "DTXVaultOracle",
      args: [underlyingOracle, vault, "8"],
      ...COMMON_DEPLOY_PARAMS,
    });

    console.log("DTXVaultOracle deployed at:", DTXVaultOracle.address);
  });
