/*
gasback contract
main : 0x5d84B43d662CB1787716D4804A6164Efc135FfB6
sep : 0x3BF2e8ee59630abE8F9c2377c348E7b04b9d2a92
*/

const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
  generateRandomItemTypesArray,
  generateRandomStatsArray,
} = require("../utils/utils");

const sortList = (list) => {
  list = Array.from(list);
  return list.sort((a, b) => Number(a) - Number(b));
};
const GAS_BACK = "0x5d84B43d662CB1787716D4804A6164Efc135FfB6";

const DISTRIBUTOR =
  "0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d";
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
const setUp = async () => {
  const [deployer, user1, user2, user3, tokenMinter] =
    await ethers.getSigners();
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  const TeamVault = await ethers.getContractFactory("TeamVault");
  const teamVault = await TeamVault.deploy(
    GAS_BACK,
    gameToken.target,
    deployer
  );

  const PvpVault = await ethers.getContractFactory("PvpVault");
  const pvpVault = await PvpVault.deploy(gameToken.target, deployer);

  const Pvp = await ethers.getContractFactory("Pvp");
  const pvp = await Pvp.deploy(
    gameToken.target,
    deployer,
    pvpVault.target,
    teamVault.target
  );
  await gameToken.grantRole(TOKEN_MINTER, tokenMinter.address);
  await pvpVault.grantRole(DISTRIBUTOR, pvp.target);

  await Promise.all(
    [user1, user2, user3].map(async (v) => {
      await gameToken.connect(v).approve(pvp.target, ethers.MaxUint256);
      await gameToken
        .connect(tokenMinter)
        .mint(v.address, ethers.parseEther("1000"));
    })
  );

  return {
    deployer,
    user1,
    user2,
    user3,
    gameToken,
    teamVault,
    pvpVault,
    pvp,
  };
};

describe("Pvp Test", () => {
  let deployer, user1, user2, user3;
  let gameToken, teamVault, pvpVault, pvp;

  beforeEach(async () => {
    ({ deployer, user1, user2, user3, gameToken, teamVault, pvpVault, pvp } =
      await loadFixture(setUp));
  });

  it.only("Check if createPvp works fine", async () => {
    const battingAmount = ethers.parseEther("10");
    const first_pvpId = await pvp.id();
    const battingTokenBalanceOfUser1 = await gameToken.balanceOf(user1.address);
    const battingTokenBalanceOfPvpVault = await gameToken.balanceOf(
      pvpVault.target
    );

    await expect(pvp.connect(user1).createPvp(battingAmount))
      .to.emit(pvp, "Create")
      .withArgs(first_pvpId, user1.address, battingAmount);

    const second_pvpId = await pvp.id();
    await pvp.connect(user2).createPvp(battingAmount);
    expect(await pvp.battleIdsListByUser(user1.address, 0, 10)).to.deep.eq([
      first_pvpId,
    ]);
    expect(await pvp.battleIdsListByUser(user2.address, 0, 10)).to.deep.eq([
      second_pvpId,
    ]);
    expect(await pvp.battleIdsList(0, 10)).to.deep.eq([
      first_pvpId,
      second_pvpId,
    ]);

    expect(await pvp.pvpInfoById(first_pvpId)).to.deep.eq([
      user1.address,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      battingAmount,
      battingAmount,
      false,
    ]);

    expect(await gameToken.balanceOf(user1.address)).to.eq(
      battingTokenBalanceOfUser1 - battingAmount
    );

    expect(await gameToken.balanceOf(pvpVault.target)).to.eq(
      battingTokenBalanceOfPvpVault + battingAmount + battingAmount
    );
  });

  it("Check if joinPvp works fine", async () => {
    const battingAmount = ethers.parseEther("10");
    const first_pvpId = await pvp.id();
    await pvp.connect(user1).createPvp(battingAmount);

    await expect(pvp.connect(user2.address).joinPvp(first_pvpId))
      .to.emit(pvp, "Join")
      .withArgs(first_pvpId, user2.address, battingAmount);
  });
});
