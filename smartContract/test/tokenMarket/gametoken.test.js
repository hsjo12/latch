const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
const setUp = async () => {
  const [deployer, tokenMinter, receiver] = await ethers.getSigners();
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();

  return {
    deployer,
    tokenMinter,
    receiver,
    gameToken,
  };
};
describe("Game token Test", () => {
  let deployer, tokenMinter, receiver, gameToken;

  beforeEach(async () => {
    ({ deployer, tokenMinter, receiver, gameToken } = await loadFixture(setUp));
  });

  it("Check token name and symbol", async () => {
    expect(await gameToken.name()).to.eq("GameToken");
    expect(await gameToken.symbol()).to.eq("GT");
  });

  it("Check if initial supply is 0", async () => {
    expect(await gameToken.totalSupply()).to.eq(0);
  });

  it("Check if a tokenMinter can mint tokens", async () => {
    await gameToken.grantRole(TOKEN_MINTER, tokenMinter.address);
    const mintedAmount = ethers.parseEther("10");
    await gameToken.connect(tokenMinter).mint(receiver.address, mintedAmount);
    expect(await gameToken.balanceOf(receiver.address)).to.eq(mintedAmount);
  });

  it("Check if only other users with no TOKEN_MINTER role can not mint tokens", async () => {
    const mintedAmount = ethers.parseEther("10");
    await expect(gameToken.mint(receiver.address, mintedAmount)).to.reverted;
  });
});
