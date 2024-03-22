import { task } from "hardhat/config";
import {
  GAS_REFUND_IMPL,
  GAS_REFUND_PROXY,
  GasRefund__factory,
  getBlastContractAddress,
  getContract,
  getPacPoolWrapper,
  InitializableAdminUpgradeabilityProxy,
  waitForTx,
} from "../../helpers";
import { COMMON_DEPLOY_PARAMS } from "../../helpers/env";

task(`deploy-gas-refund`, `deploy yield and gas controller`).setAction(
  async (_, hre) => {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    const poolWrapper = await getPacPoolWrapper();

    const blastAddress = getBlastContractAddress(hre.network.name);
    const gasRefund = await deploy(GAS_REFUND_IMPL, {
      from: deployer,
      contract: "GasRefund",
      args: [poolWrapper.address, blastAddress],
      ...COMMON_DEPLOY_PARAMS,
    });
    console.log("gasRefund IMPL deployed at:", gasRefund.address);

    const initData =
      GasRefund__factory.createInterface().encodeFunctionData("initialize");

    const gasRefundProxy = await deploy(GAS_REFUND_PROXY, {
      from: deployer,
      contract: "InitializableAdminUpgradeabilityProxy",
      args: [],
      ...COMMON_DEPLOY_PARAMS,
    });
    console.log("gasRefundProxy deployed at:", gasRefundProxy.address);

    const proxyInstance = (await getContract(
      "InitializableAdminUpgradeabilityProxy",
      gasRefundProxy.address
    )) as InitializableAdminUpgradeabilityProxy;
    await waitForTx(
      await proxyInstance["initialize(address,address,bytes)"](
        gasRefund.address,
        deployer,
        initData
      )
    );
  }
);
