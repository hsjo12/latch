const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
const setUp = async () => {
  const [deployer, user1, user2] = await ethers.getSigners();
  const Latch = await ethers.getContractFactory("Latch");
  const latch = await Latch.deploy();
  const TokenMarket = await ethers.getContractFactory("TokenMarket");
  const tokenMarket = await TokenMarket.deploy(latch.target);
  await latch.grantRole(TOKEN_MINTER, tokenMarket.target);
  return {
    deployer,
    user1,
    user2,
    latch,
    tokenMarket,
  };
};
const getRequiredETH = (pricePerTokenInETH, tokenAmount) => {
  return (pricePerTokenInETH * tokenAmount) / ethers.parseEther("1");
};
describe("Game token Test", () => {
  let deployer, user1, user2, latch, tokenMarket;

  beforeEach(async () => {
    ({ deployer, user1, user2, latch, tokenMarket } = await loadFixture(setUp));
  });

  it("Check token sale token", async () => {
    expect(await tokenMarket.SALE_TOKEN()).to.eq(await latch.target);
  });

  it("Check if a manager can change token price", async () => {
    const newPrice = ethers.parseEther("1");
    await tokenMarket.setPricePerToken(newPrice);
    expect(await tokenMarket.pricePerToken()).to.eq(newPrice);
  });

  it("Check if others can not change token price", async () => {
    const newPrice = ethers.parseEther("1");
    await expect(tokenMarket.connect(user1).setPricePerToken(newPrice)).to
      .reverted;
  });

  it("Check if user can buy tokens with ETH", async () => {
    const pricePerTokenInETH = await tokenMarket.pricePerToken();
    const tokenAmount = ethers.parseEther("1");
    const requiredETH = getRequiredETH(pricePerTokenInETH, tokenAmount);

    expect(await latch.balanceOf(user1.address)).to.eq(0);
    await expect(
      tokenMarket.connect(user1).buyToken(tokenAmount, { value: requiredETH })
    )
      .to.emit(tokenMarket, "Buy")
      .withArgs(user1.address, tokenAmount);
    expect(await latch.balanceOf(user1.address)).to.eq(tokenAmount);
  });

  it("Check if user can sell tokens with ETH", async () => {
    const pricePerTokenInETH = await tokenMarket.pricePerToken();
    const tokenAmount = await ethers.parseEther("1");
    const requiredETH = getRequiredETH(pricePerTokenInETH, tokenAmount);

    await tokenMarket
      .connect(user1)
      .buyToken(tokenAmount, { value: requiredETH });
    const tokenBalanceOfUser1 = await latch.balanceOf(user1.address);
    const ethBalanceOfUser1 = await ethers.provider.getBalance(user1.address);

    await latch.connect(user1).approve(tokenMarket.target, ethers.MaxUint256);

    await expect(tokenMarket.connect(user1).sellToken(tokenBalanceOfUser1))
      .to.emit(tokenMarket, "Sell")
      .withArgs(user1.address, requiredETH);
    expect(await latch.balanceOf(user1.address)).to.eq(0);
    expect(await ethers.provider.getBalance(user1.address)).to.gt(
      ethBalanceOfUser1
    );
  });

  it("Check if tooSmallAmount is reverted in buyToken", async () => {
    const pricePerTokenInETH = await tokenMarket.pricePerToken();
    const tokenAmount = 10n;
    const requiredETH = getRequiredETH(pricePerTokenInETH, tokenAmount);
    await expect(
      tokenMarket.buyToken(10, { value: requiredETH })
    ).to.revertedWithCustomError(tokenMarket, "tooSmallAmount");
  });
  it("Check if insufficientAmount is reverted in buyToken", async () => {
    const pricePerTokenInETH = await tokenMarket.pricePerToken();
    const tokenAmount = ethers.parseEther("1");
    const requiredETH = getRequiredETH(pricePerTokenInETH, tokenAmount);
    const lessRequiredETH = requiredETH - 10n;
    await expect(
      tokenMarket.buyToken(tokenAmount, { value: lessRequiredETH })
    ).to.revertedWithCustomError(tokenMarket, "insufficientAmount");
  });
  it("Check if tooSmallAmount is reverted in sellToken", async () => {
    const tokenAmount = 10n;
    await expect(tokenMarket.sellToken(tokenAmount)).to.revertedWithCustomError(
      tokenMarket,
      "tooSmallAmount"
    );
  });
});
