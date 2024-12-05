const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
const setUp = async () => {
  const [deployer, user1, user2] = await ethers.getSigners();
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  const TokenMarket = await ethers.getContractFactory("TokenMarket");
  const tokenMarket = await TokenMarket.deploy(gameToken.target);
  await gameToken.grantRole(TOKEN_MINTER, tokenMarket.target);
  return {
    deployer,
    user1,
    user2,
    gameToken,
    tokenMarket,
  };
};
const getRequiredETH = (pricePerTokenInETH, tokenAmount) => {
  return (pricePerTokenInETH * tokenAmount) / ethers.parseEther("1");
};
describe("Game token Test", () => {
  let deployer, user1, user2, gameToken, tokenMarket;

  beforeEach(async () => {
    ({ deployer, user1, user2, gameToken, tokenMarket } = await loadFixture(
      setUp
    ));
  });

  it("Check token sale token", async () => {
    expect(await tokenMarket.SALE_TOKEN()).to.eq(await gameToken.target);
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

    expect(await gameToken.balanceOf(user1.address)).to.eq(0);
    await expect(
      tokenMarket.connect(user1).buyToken(tokenAmount, { value: requiredETH })
    )
      .to.emit(tokenMarket, "Buy")
      .withArgs(user1.address, tokenAmount);
    expect(await gameToken.balanceOf(user1.address)).to.eq(tokenAmount);
  });

  it("Check if user can sell tokens with ETH", async () => {
    const pricePerTokenInETH = await tokenMarket.pricePerToken();
    const tokenAmount = await ethers.parseEther("1");
    const requiredETH = getRequiredETH(pricePerTokenInETH, tokenAmount);

    await tokenMarket
      .connect(user1)
      .buyToken(tokenAmount, { value: requiredETH });
    const tokenBalanceOfUser1 = await gameToken.balanceOf(user1.address);
    const ethBalanceOfUser1 = await ethers.provider.getBalance(user1.address);

    await gameToken
      .connect(user1)
      .approve(tokenMarket.target, ethers.MaxUint256);

    await expect(tokenMarket.connect(user1).sellToken(tokenBalanceOfUser1))
      .to.emit(tokenMarket, "Sell")
      .withArgs(user1.address, requiredETH);
    expect(await gameToken.balanceOf(user1.address)).to.eq(0);
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
