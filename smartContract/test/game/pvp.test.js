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

const GAS_BACK = "0x5d84B43d662CB1787716D4804A6164Efc135FfB6";

const DISTRIBUTOR =
  "0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d";
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";

const setUp = async () => {
  const [deployer, user1, user2, user3, tokenMinter] =
    await ethers.getSigners();
  const Latch = await ethers.getContractFactory("Latch");
  const latch = await Latch.deploy();
  const TeamVault = await ethers.getContractFactory("TeamVault");
  const teamVault = await TeamVault.deploy(GAS_BACK, latch.target, deployer);

  const PvpVault = await ethers.getContractFactory("PvpVault");
  const pvpVault = await PvpVault.deploy(latch.target, deployer);

  const Pvp = await ethers.getContractFactory("Pvp");
  const pvp = await Pvp.deploy(
    latch.target,
    deployer.address,
    pvpVault.target,
    teamVault.target
  );
  await latch.grantRole(TOKEN_MINTER, tokenMinter.address);
  await pvpVault.grantRole(DISTRIBUTOR, pvp.target);

  await Promise.all(
    [user1, user2, user3].map(async (v) => {
      await latch.connect(v).approve(pvp.target, ethers.MaxUint256);
      await latch
        .connect(tokenMinter)
        .mint(v.address, ethers.parseEther("1000"));
    })
  );

  return {
    deployer,
    user1,
    user2,
    user3,
    latch,
    teamVault,
    pvpVault,
    pvp,
  };
};

describe("Pvp Test", () => {
  let deployer, user1, user2, user3;
  let latch, teamVault, pvpVault, pvp;

  beforeEach(async () => {
    ({ deployer, user1, user2, user3, latch, teamVault, pvpVault, pvp } =
      await loadFixture(setUp));
  });

  it("Check if createPvp works fine", async () => {
    const battingAmount = ethers.parseEther("10");
    const first_pvpId = await pvp.id();
    const battingTokenBalanceOfUser1 = await latch.balanceOf(user1.address);
    const battingTokenBalanceOfPvpVault = await latch.balanceOf(
      pvpVault.target
    );

    await expect(pvp.connect(user1).createPvp(battingAmount))
      .to.emit(pvp, "Create")
      .withArgs(first_pvpId, user1.address, battingAmount);

    const second_pvpId = await pvp.id();
    await pvp.connect(user2).createPvp(battingAmount);
    expect(await pvp.pvpByUser(user1.address)).to.eq(first_pvpId);
    expect(await pvp.pvpByUser(user2.address)).to.eq(second_pvpId);
    expect(await pvp.pvpIdsList(0, 10)).to.deep.eq([first_pvpId, second_pvpId]);

    expect(await pvp.pvpInfoById(first_pvpId)).to.deep.eq([
      user1.address,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      battingAmount,
      battingAmount,
      false,
    ]);

    expect(await latch.balanceOf(user1.address)).to.eq(
      battingTokenBalanceOfUser1 - battingAmount
    );

    expect(await latch.balanceOf(pvpVault.target)).to.eq(
      battingTokenBalanceOfPvpVault + battingAmount + battingAmount
    );
  });

  it("Check if joinPvp works fine", async () => {
    const battingAmount = ethers.parseEther("10");
    const first_pvpId = await pvp.id();
    await pvp.connect(user1).createPvp(battingAmount);

    const battingTokenBalanceOfUser2 = await latch.balanceOf(user2.address);
    const battingTokenBalanceOfPvpVault = await latch.balanceOf(
      pvpVault.target
    );

    await expect(pvp.connect(user2).joinPvp(first_pvpId))
      .to.emit(pvp, "Join")
      .withArgs(first_pvpId, user2.address, battingAmount);

    expect(await pvp.pvpByUser(user2.address)).to.eq(first_pvpId);
    expect(await latch.balanceOf(user1.address)).to.eq(
      battingTokenBalanceOfUser2 - battingAmount
    );

    expect(await latch.balanceOf(pvpVault.target)).to.eq(
      battingTokenBalanceOfPvpVault + battingAmount
    );

    expect(await pvp.pvpInfoById(first_pvpId)).to.deep.eq([
      user1.address,
      user2.address,
      ethers.ZeroAddress,
      battingAmount,
      battingAmount * 2n,
      false,
    ]);
  });

  it("Check if removePvp works fine", async () => {
    const battingAmount = ethers.parseEther("10");
    const none_pvpId = 0n;
    const first_pvpId = await pvp.id();
    await pvp.connect(user1).createPvp(battingAmount);

    const battingTokenBalanceOfUser1 = await latch.balanceOf(user1.address);
    const battingTokenBalanceOfPvpVault = await latch.balanceOf(
      pvpVault.target
    );
    await expect(pvp.connect(user1).removePvp(first_pvpId))
      .to.emit(pvp, "Remove")
      .withArgs(first_pvpId, user1.address, battingAmount);

    expect(await latch.balanceOf(user1.address)).to.eq(
      battingTokenBalanceOfUser1 + battingAmount
    );

    expect(await latch.balanceOf(pvpVault.target)).to.eq(
      battingTokenBalanceOfPvpVault - battingAmount
    );
    expect(await pvp.pvpByUser(user1.address)).to.eq(none_pvpId);
    expect(await pvp.pvpByUser(user2.address)).to.eq(none_pvpId);
    expect(await pvp.pvpIdsList(0, 10)).to.deep.eq([]);

    expect(await pvp.pvpInfoById(first_pvpId)).to.deep.eq([
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      0,
      0,
      false,
    ]);
  });

  it("Check if announce works fine", async () => {
    const battingAmount = ethers.parseEther("10");
    const first_pvpId = await pvp.id();
    const teamTax = await pvp.teamTax();
    await pvp.connect(user1).createPvp(battingAmount);
    await pvp.connect(user2).joinPvp(first_pvpId);

    let totalPrize = (await pvp.pvpInfoById(first_pvpId)).totalPrize;
    const toTeam = (totalPrize * teamTax) / 10_000n;
    const battingTokenBalanceOfUser1 = await latch.balanceOf(user1.address);
    const battingTokenBalanceOfTeam = await latch.balanceOf(teamVault.target);
    totalPrize = totalPrize - toTeam;
    await expect(pvp.announce(user1.address, first_pvpId))
      .to.emit(pvp, "Announce")
      .withArgs(first_pvpId, user1.address, totalPrize);

    expect(await latch.balanceOf(user1.address)).to.eq(
      battingTokenBalanceOfUser1 + totalPrize
    );
    expect(await latch.balanceOf(teamVault.target)).to.eq(
      battingTokenBalanceOfTeam + toTeam
    );
    expect(await pvp.pvpInfoById(first_pvpId)).to.deep.eq([
      user1.address,
      user2.address,
      user1.address,
      battingAmount,
      totalPrize,
      true,
    ]);
  });

  it("Check if setTeamTax, setPvpVault, setTeamVault, and setBattingToken work fine", async () => {
    const tax = 0;
    const zeroAddress = ethers.ZeroAddress;

    await pvp.setTeamTax(tax);
    await pvp.setPvpVault(zeroAddress);
    await pvp.setTeamVault(zeroAddress);
    await pvp.setBattingToken(zeroAddress);

    expect(await pvp.teamTax()).to.eq(tax);
    expect(await pvp.pvpVault()).to.eq(zeroAddress);
    expect(await pvp.teamVault()).to.eq(zeroAddress);
    expect(await pvp.battingToken()).to.eq(zeroAddress);
  });

  it("Check if revert statements work in the createPvp function", async () => {
    const battingAmount = ethers.parseEther("10");
    const pvpId = await pvp.id();
    await pvp.connect(user1).createPvp(battingAmount);
    await pvp.connect(user2).joinPvp(pvpId);

    await expect(
      pvp.connect(user1).createPvp(battingAmount)
    ).to.revertedWithCustomError(pvp, "AlreadyInvolvedInPVP");
    await expect(
      pvp.connect(user2).createPvp(battingAmount)
    ).to.revertedWithCustomError(pvp, "AlreadyInvolvedInPVP");
  });

  it("Check if revert statements work in the joinPvp function", async () => {
    const battingAmount = ethers.parseEther("10");
    const pvpId = await pvp.id();
    await pvp.connect(user1).createPvp(battingAmount);

    const fakePvpId = pvpId + 10n;
    await expect(pvp.joinPvp(fakePvpId)).to.revertedWithCustomError(
      pvp,
      "PvpNotFound"
    );
    await expect(pvp.connect(user1).joinPvp(pvpId)).to.revertedWithCustomError(
      pvp,
      "CannotBeCreator"
    );

    await pvp.connect(user2).joinPvp(pvpId);
    await expect(pvp.connect(user3).joinPvp(pvpId)).to.revertedWithCustomError(
      pvp,
      "ParticipantExists"
    );
  });

  it("Check if revert statements work in the removePvp function", async () => {
    const battingAmount = ethers.parseEther("10");
    const pvpId = await pvp.id();
    await pvp.connect(user1).createPvp(battingAmount);

    const fakePvpId = pvpId + 10n;
    await expect(
      pvp.connect(user2).removePvp(fakePvpId)
    ).to.revertedWithCustomError(pvp, "OnlyCreator");
    await expect(
      pvp.connect(user2).removePvp(pvpId)
    ).to.revertedWithCustomError(pvp, "OnlyCreator");

    await pvp.connect(user2).joinPvp(pvpId);
    await expect(
      pvp.connect(user1).removePvp(pvpId)
    ).to.revertedWithCustomError(pvp, "ParticipantExists");
  });

  it("Check if revert statements work in the announce function", async () => {
    const battingAmount = ethers.parseEther("10");
    const pvpId = await pvp.id();
    await pvp.connect(user1).createPvp(battingAmount);
    await pvp.connect(user2).joinPvp(pvpId);

    await expect(pvp.connect(user1).announce(user1.address, pvpId)).to.reverted;

    await expect(pvp.announce(user3.address, pvpId)).to.revertedWithCustomError(
      pvp,
      "InvalidWinner"
    );

    await pvp.announce(user1.address, pvpId);

    await expect(pvp.announce(user1.address, pvpId)).to.revertedWithCustomError(
      pvp,
      "AlreadyAnnounced"
    );
  });
});
