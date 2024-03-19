import { parseEther } from "ethers/lib/utils";
import { makeSuite, TestEnv } from "./utils/make-suite";
import { evmRevert, evmSnapshot, MAX_UINT_AMOUNT } from "../helpers";
import { ethers } from "hardhat";
const { expect } = require("chai");
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

makeSuite("Pac Pool Wrapper Test", (testEnv: TestEnv) => {
  let snapId: string;
  before(async () => {
    const {
      weth,
      usdc,
      deployer,
      wrappedTokenGateway,
      uniswapFactory,
      uniswapRouter,
      poolWrapper,
    } = testEnv;

    await wrappedTokenGateway
      .connect(deployer.signer)
      .depositETH(weth.address, deployer.address, 0, {
        value: parseEther("10"),
      });

    await uniswapFactory
      .connect(deployer.signer)
      .createPair(weth.address, usdc.address);

    //prepare asset
    await weth.connect(deployer.signer).deposit({
      value: parseEther("100"),
    });
    await usdc.connect(deployer.signer)["mint(uint256)"]("100000000000");

    await weth
      .connect(deployer.signer)
      .approve(uniswapRouter.address, MAX_UINT_AMOUNT);
    await usdc
      .connect(deployer.signer)
      .approve(uniswapRouter.address, MAX_UINT_AMOUNT);

    await uniswapRouter
      .connect(deployer.signer)
      .addLiquidity(
        weth.address,
        usdc.address,
        parseEther("100"),
        "100000000000",
        "0",
        "0",
        deployer.address,
        "111111111111111111111"
      );

    await poolWrapper.setSwapRouter(uniswapRouter.address);
  });

  beforeEach(async () => {
    snapId = await evmSnapshot();
  });
  afterEach(async () => {
    await evmRevert(snapId);
  });

  it("test erc20 operation", async () => {
    const { weth, poolWrapper, deployer, aWETH, debtWETH } = testEnv;

    await weth.connect(deployer.signer).deposit({ value: parseEther("10") });

    await weth
      .connect(deployer.signer)
      .approve(poolWrapper.address, MAX_UINT_AMOUNT);

    await debtWETH
      .connect(deployer.signer)
      .approveDelegation(poolWrapper.address, MAX_UINT_AMOUNT);

    await poolWrapper
      .connect(deployer.signer)
      .supplyERC20(weth.address, parseEther("10"), deployer.address);

    expect(await aWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("20"),
      parseEther("0.1")
    );
    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("0"),
      parseEther("0.01")
    );

    await aWETH
      .connect(deployer.signer)
      .approve(poolWrapper.address, MAX_UINT_AMOUNT);
    await poolWrapper
      .connect(deployer.signer)
      .withdrawERC20(weth.address, parseEther("10"), deployer.address);

    expect(await weth.balanceOf(deployer.address)).closeTo(
      parseEther("10"),
      parseEther("0.1")
    );

    await poolWrapper
      .connect(deployer.signer)
      .borrowERC20(weth.address, parseEther("5"), 2);

    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("5"),
      parseEther("0.01")
    );
    expect(await weth.balanceOf(deployer.address)).closeTo(
      parseEther("15"),
      parseEther("0.1")
    );

    await poolWrapper
      .connect(deployer.signer)
      .repayERC20(weth.address, parseEther("10"), 2, deployer.address);

    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("0"),
      parseEther("0.01")
    );
    expect(await weth.balanceOf(deployer.address)).closeTo(
      parseEther("10"),
      parseEther("0.1")
    );
  });

  it("test ETH operation", async () => {
    const { weth, poolWrapper, deployer, aWETH, debtWETH } = testEnv;

    await weth.connect(deployer.signer).deposit({ value: parseEther("10") });

    await weth
      .connect(deployer.signer)
      .approve(poolWrapper.address, MAX_UINT_AMOUNT);

    await debtWETH
      .connect(deployer.signer)
      .approveDelegation(poolWrapper.address, MAX_UINT_AMOUNT);

    let ethBalanceBefore = await deployer.signer.getBalance();
    await poolWrapper.connect(deployer.signer).depositETH(deployer.address, {
      value: parseEther("10"),
    });
    let ethBalanceAfter = await deployer.signer.getBalance();
    expect(ethBalanceBefore.sub(ethBalanceAfter)).closeTo(
      parseEther("10"),
      parseEther("0.1")
    );
    expect(await aWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("20"),
      parseEther("0.1")
    );
    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("0"),
      parseEther("0.01")
    );

    await aWETH
      .connect(deployer.signer)
      .approve(poolWrapper.address, MAX_UINT_AMOUNT);
    ethBalanceBefore = await deployer.signer.getBalance();
    await poolWrapper
      .connect(deployer.signer)
      .withdrawETH(parseEther("10"), deployer.address);
    ethBalanceAfter = await deployer.signer.getBalance();
    expect(ethBalanceAfter.sub(ethBalanceBefore)).closeTo(
      parseEther("10"),
      parseEther("0.1")
    );

    ethBalanceBefore = await deployer.signer.getBalance();
    await poolWrapper.connect(deployer.signer).borrowETH(parseEther("5"), 2);
    ethBalanceAfter = await deployer.signer.getBalance();
    expect(ethBalanceAfter.sub(ethBalanceBefore)).closeTo(
      parseEther("5"),
      parseEther("0.1")
    );
    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("5"),
      parseEther("0.01")
    );

    ethBalanceBefore = await deployer.signer.getBalance();
    await poolWrapper
      .connect(deployer.signer)
      .repayETH(parseEther("10"), 2, deployer.address, {
        value: parseEther("10"),
      });
    ethBalanceAfter = await deployer.signer.getBalance();
    expect(ethBalanceBefore.sub(ethBalanceAfter)).closeTo(
      parseEther("5"),
      parseEther("0.1")
    );
    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("0"),
      parseEther("0.01")
    );
  });

  it("test weth leverage deposit", async () => {
    const { weth, poolWrapper, deployer, aWETH, debtWETH } = testEnv;

    await weth.connect(deployer.signer).deposit({ value: parseEther("10") });

    expect(await weth.balanceOf(deployer.address)).eq(parseEther("10"));

    await weth
      .connect(deployer.signer)
      .approve(poolWrapper.address, MAX_UINT_AMOUNT);

    await debtWETH
      .connect(deployer.signer)
      .approveDelegation(poolWrapper.address, MAX_UINT_AMOUNT);

    await poolWrapper
      .connect(deployer.signer)
      .leverageDeposit(weth.address, parseEther("10"), parseEther("5"));

    expect(await aWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("25"),
      parseEther("0.1")
    );
    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("5"),
      parseEther("0.01")
    );
  });

  it("test eth leverage deposit", async () => {
    const { poolWrapper, deployer, aWETH, debtWETH } = testEnv;

    await debtWETH
      .connect(deployer.signer)
      .approveDelegation(poolWrapper.address, MAX_UINT_AMOUNT);

    await poolWrapper
      .connect(deployer.signer)
      .leverageDeposit(ZERO_ADDRESS, parseEther("10"), parseEther("5"), {
        value: parseEther("10"),
      });

    expect(await aWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("25"),
      parseEther("0.1")
    );
    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("5"),
      parseEther("0.01")
    );
  });

  it("test weth multiplier deposit", async () => {
    const { poolWrapper, deployer, weth, aWETH, debtWETH, usdc, aUsdc } =
      testEnv;

    await weth.connect(deployer.signer).deposit({ value: parseEther("1") });

    await weth
      .connect(deployer.signer)
      .approve(poolWrapper.address, MAX_UINT_AMOUNT);
    await debtWETH
      .connect(deployer.signer)
      .approveDelegation(poolWrapper.address, MAX_UINT_AMOUNT);

    await poolWrapper
      .connect(deployer.signer)
      .multiplierDeposit(
        weth.address,
        parseEther("1"),
        parseEther("1"),
        usdc.address,
        "1800000000",
        [weth.address, usdc.address]
      );

    expect(await aWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("10"),
      parseEther("0.1")
    );
    expect(await aUsdc.balanceOf(deployer.address)).to.be.gt("1800000000");
    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("1"),
      parseEther("0.01")
    );
  });

  it("test eth multiplier deposit", async () => {
    const { poolWrapper, deployer, weth, aWETH, debtWETH, usdc, aUsdc } =
      testEnv;

    await debtWETH
      .connect(deployer.signer)
      .approveDelegation(poolWrapper.address, MAX_UINT_AMOUNT);

    await poolWrapper
      .connect(deployer.signer)
      .multiplierDeposit(
        ZERO_ADDRESS,
        parseEther("1"),
        parseEther("1"),
        usdc.address,
        "1800000000",
        [weth.address, usdc.address],
        {
          value: parseEther("1"),
        }
      );

    expect(await aWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("10"),
      parseEther("0.1")
    );
    expect(await aUsdc.balanceOf(deployer.address)).to.be.gt("1800000000");
    expect(await debtWETH.balanceOf(deployer.address)).to.be.closeTo(
      parseEther("1"),
      parseEther("0.01")
    );
  });

  it("test rescue erc20", async () => {
    const { weth, poolWrapper, deployer } = testEnv;

    await weth.connect(deployer.signer).deposit({ value: parseEther("10") });

    expect(await weth.balanceOf(deployer.address)).eq(parseEther("10"));

    await weth
      .connect(deployer.signer)
      .transfer(poolWrapper.address, parseEther("10"));

    await poolWrapper
      .connect(deployer.signer)
      .rescueToken(weth.address, deployer.address, parseEther("10"));

    expect(await weth.balanceOf(deployer.address)).eq(parseEther("10"));
  });

  it("revert test", async () => {
    const { weth, poolWrapper, deployer, users } = testEnv;

    await expect(
      poolWrapper
        .connect(deployer.signer)
        .leverageDeposit(weth.address, parseEther("10"), "0")
    ).to.be.revertedWithCustomError(poolWrapper, "ZeroAmount");

    await expect(
      poolWrapper
        .connect(deployer.signer)
        .leverageDeposit(weth.address, parseEther("10"), parseEther("5"), {
          value: parseEther("10"),
        })
    ).to.be.revertedWithCustomError(poolWrapper, "InvalidMsgValue");

    await expect(
      poolWrapper
        .connect(deployer.signer)
        .leverageDeposit(ZERO_ADDRESS, parseEther("10"), parseEther("5"))
    ).to.be.revertedWithCustomError(poolWrapper, "InvalidMsgValue");

    await expect(
      poolWrapper
        .connect(deployer.signer)
        .executeOperation(
          ZERO_ADDRESS,
          parseEther("10"),
          parseEther("5"),
          poolWrapper.address,
          ethers.utils.defaultAbiCoder.encode(
            ["uint256", "address", "uint256", "uint256"],
            [0, deployer.address, 0, parseEther("10")]
          )
        )
    ).to.be.revertedWithCustomError(poolWrapper, "InvalidFlashLoan");

    await expect(
      poolWrapper
        .connect(users[1].signer)
        .rescueToken(weth.address, deployer.address, parseEther("5"))
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      poolWrapper.connect(users[1].signer).setGasRefund(weth.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      deployer.signer.sendTransaction({
        to: poolWrapper.address,
        value: parseEther("5"),
      })
    ).to.be.revertedWithCustomError(poolWrapper, "ReceiveNotAllowed");
  });
});
