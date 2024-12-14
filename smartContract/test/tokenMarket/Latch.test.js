const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
const setUp = async () => {
  const [deployer, tokenMinter, receiver] = await ethers.getSigners();
  const Latch = await ethers.getContractFactory("Latch");
  const latch = await Latch.deploy();

  return {
    deployer,
    tokenMinter,
    receiver,
    latch,
  };
};
describe("Latch token Test", () => {
  let tokenMinter, receiver, latch;

  beforeEach(async () => {
    ({ deployer, tokenMinter, receiver, latch } = await loadFixture(setUp));
  });

  it("Check token name and symbol", async () => {
    expect(await latch.name()).to.eq("LATCH");
    expect(await latch.symbol()).to.eq("LAT");
  });

  it("Check if initial supply is 0", async () => {
    expect(await latch.totalSupply()).to.eq(0);
  });

  it("Check if a tokenMinter can mint tokens", async () => {
    await latch.grantRole(TOKEN_MINTER, tokenMinter.address);
    const mintedAmount = ethers.parseEther("10");
    await latch.connect(tokenMinter).mint(receiver.address, mintedAmount);
    expect(await latch.balanceOf(receiver.address)).to.eq(mintedAmount);
  });

  it("Check if only other users with no TOKEN_MINTER role can not mint tokens", async () => {
    const mintedAmount = ethers.parseEther("10");
    await expect(latch.mint(receiver.address, mintedAmount)).to.reverted;
  });
});
