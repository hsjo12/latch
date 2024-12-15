/*
gasback contract
main : 0x5d84B43d662CB1787716D4804A6164Efc135FfB6
sep : 0x3BF2e8ee59630abE8F9c2377c348E7b04b9d2a92
*/

const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

const GAS_BACK = "0x5d84B43d662CB1787716D4804A6164Efc135FfB6";

const DISTRIBUTOR =
  "0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d";
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";

const nftId_0 = 0;
const nftId_1 = 1;
const nftId_2 = 2;

const SWORD_STATS = [10, 10, 0, 100];
const SHIELD_STATS = [0, 100, 0, 100];
const BOOTS_STATS = [0, 0, 100, 100];

const PRICE_LIST = [
  ethers.parseEther("1"),
  ethers.parseEther("1"),
  ethers.parseEther("1"),
];

const setUp = async () => {
  const [deployer, user1, user2, user3, tokenMinter] =
    await ethers.getSigners();
  const Latch = await ethers.getContractFactory("Latch");
  const latch = await Latch.deploy();

  const TeamVault = await ethers.getContractFactory("TeamVault");
  const teamVault = await TeamVault.deploy(GAS_BACK, latch.target, deployer);

  const Items = await ethers.getContractFactory("Items");
  const items = await Items.deploy(
    GAS_BACK,
    latch.target,
    deployer.address,
    teamVault.target
  );

  const RaidVault = await ethers.getContractFactory("RaidVault");
  const raidVault = await RaidVault.deploy(latch.target, deployer);

  const Raid = await ethers.getContractFactory("Raid");
  const raid = await Raid.deploy(
    latch.target,
    deployer.address,
    raidVault.target,
    teamVault.target
  );
  await latch.grantRole(TOKEN_MINTER, tokenMinter.address);
  await raidVault.grantRole(DISTRIBUTOR, raid.target);

  await Promise.all(
    [deployer, user1, user2, user3].map(async (v) => {
      await latch.connect(v).approve(raid.target, ethers.MaxUint256);
      await latch
        .connect(tokenMinter)
        .mint(v.address, ethers.parseEther("1000"));
    })
  );
  await latch.approve(items.target, ethers.MaxUint256);
  await items.initializeItems([nftId_0, nftId_1, nftId_2], PRICE_LIST, [
    SWORD_STATS,
    SHIELD_STATS,
    BOOTS_STATS,
  ]);
  await items.mintItems(1, 100);
  await items.setApprovalForAll(raid.target, true);
  return {
    deployer,
    user1,
    user2,
    user3,
    latch,
    teamVault,
    raidVault,
    raid,
    items,
  };
};

describe("Raid Test", () => {
  let deployer, user1, user2, user3;
  let latch, teamVault, raidVault, raid, items;

  beforeEach(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      latch,
      items,
      teamVault,
      raidVault,
      raid,
    } = await loadFixture(setUp));
  });

  it("Check if createRaid works fine", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000);
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10;
    const raidId_1 = await raid.id();

    const battingTokenBalanceOfRaidVault = await latch.balanceOf(
      raidVault.target
    );
    const testERC115BalanceOfRaidVault = await items.balanceOf(
      raidVault.target,
      1
    );

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await expect(
      raid.createRaid(
        prizeInfoList,
        raidFee,
        openingTime,
        closingTime,
        maxParticipants
      )
    )
      .to.emit(raid, "Create")
      .withArgs(raidId_1, deployer.address);

    const raidId_2 = await raid.id();

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    expect(await raid.getRaidIdList(0, 10)).to.deep.eq([raidId_1, raidId_2]);

    expect(await raid.getRaidInfoInfoById(raidId_1)).to.deep.eq([
      prizeInfoList,
      [],
      raidFee,
      openingTime,
      closingTime,
      maxParticipants,
      false,
    ]);

    expect(await latch.balanceOf(raidVault.target)).to.eq(
      battingTokenBalanceOfRaidVault + prizeERC20TokenAmount * 2n
    );
    expect(await items.balanceOf(raidVault.target, 1)).to.eq(
      testERC115BalanceOfRaidVault + prizeERC1155TokenAmount * 2n
    );
    expect(await raid.getRaidIdList(0, 10)).to.deep.eq([raidId_1, raidId_2]);
  });

  it("Check if joinRaid works fine", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000) - 10000;
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10;
    const raidId_1 = await raid.id();

    const battingTokenBalanceOfTeamVault = await latch.balanceOf(
      teamVault.target
    );

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await expect(raid.connect(user1).joinRaid(raidId_1))
      .to.emit(raid, "Join")
      .withArgs(raidId_1, user1.address, raidFee);

    expect(await raid.getRaidInfoInfoById(raidId_1)).to.deep.eq([
      prizeInfoList,
      [user1.address],
      raidFee,
      openingTime,
      closingTime,
      maxParticipants,
      false,
    ]);

    expect(await latch.balanceOf(teamVault.target)).to.eq(
      battingTokenBalanceOfTeamVault + raidFee
    );
  });

  it("Check if removeRaid works fine", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000);
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10;
    const raidId_1 = await raid.id();

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await expect(raid.removeRaid(raidId_1))
      .to.emit(raid, "Remove")
      .withArgs(raidId_1, deployer.address);

    expect(await raid.getRaidIdList(0, 10)).to.deep.eq([]);
  });

  it("Check if complete works fine", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000);
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10;
    const raidId_1 = await raid.id();

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await raid.complete(raidId_1);

    expect(await raid.getRaidInfoInfoById(raidId_1)).to.deep.eq([
      prizeInfoList,
      [],
      raidFee,
      openingTime,
      closingTime,
      maxParticipants,
      true,
    ]);
  });

  it("Check if claimPrize works fine", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000) - 10000;
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10n;
    const raidId_1 = await raid.id();

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await raid.connect(user1).joinRaid(raidId_1);
    await raid.connect(user2).joinRaid(raidId_1);

    expect(await raid.getRaidIdList(0, 10)).to.deep.eq([raidId_1]);

    expect(await raid.getUserRaidIdList(user1.address, 0, 10)).to.deep.eq([
      raidId_1,
    ]);
    expect(await raid.getUserRaidIdList(user2.address, 0, 10)).to.deep.eq([
      raidId_1,
    ]);

    await raid.complete(raidId_1);

    const erc20PrizeBalanceOfUser1 = await latch.balanceOf(user1.address);
    const erc20PrizeBalanceOfUser2 = await latch.balanceOf(user2.address);

    const erc1155PrizeBalanceOfUser1 = await items.balanceOf(user1.address, 1);
    const erc1155PrizeBalanceOfUser2 = await items.balanceOf(user2.address, 1);
    await expect(raid.connect(user1).claimPrize(raidId_1))
      .to.emit(raid, "ClaimPrize")
      .withArgs(raidId_1, user1.address);

    await expect(raid.connect(user2).claimPrize(raidId_1))
      .to.emit(raid, "ClaimPrize")
      .withArgs(raidId_1, user2.address);

    const erc20PrizeAmount = prizeERC20TokenAmount / maxParticipants;
    const erc1155PrizeAmount = 1n;
    expect(await latch.balanceOf(user1.address)).to.eq(
      erc20PrizeBalanceOfUser1 + erc20PrizeAmount
    );
    expect(await latch.balanceOf(user2.address)).to.eq(
      erc20PrizeBalanceOfUser2 + erc20PrizeAmount
    );

    expect(await items.balanceOf(user1.address, 1)).to.eq(
      erc1155PrizeBalanceOfUser1 + erc1155PrizeAmount
    );
    expect(await items.balanceOf(user2.address, 1)).to.eq(
      erc1155PrizeBalanceOfUser2 + erc1155PrizeAmount
    );

    expect(await raid.getRaidIdList(0, 10)).to.deep.eq([]);
    expect(await raid.getUserRaidIdList(user1.address, 0, 10)).to.deep.eq([]);
    expect(await raid.getUserRaidIdList(user2.address, 0, 10)).to.deep.eq([]);
  });

  it("Check if withdrawLeftoverPrize works fine", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000) - 10000;
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10n;
    const raidId_1 = await raid.id();

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await raid.connect(user1).joinRaid(raidId_1);
    await raid.connect(user2).joinRaid(raidId_1);

    await raid.complete(raidId_1);

    const erc20PrizeBalanceOfDeployer = await latch.balanceOf(deployer.address);
    const erc1155PrizeBalanceOfDeployer = await items.balanceOf(
      deployer.address,
      1
    );
    await raid.withdrawLeftoverPrize(raidId_1);
    const leftOverERC20Prize =
      prizeERC20TokenAmount -
      (prizeERC20TokenAmount / maxParticipants) * BigInt(prizeInfoList.length);
    const leftOverERC1155Prize =
      prizeERC1155TokenAmount - BigInt(prizeInfoList.length);

    expect(await latch.balanceOf(deployer.address)).to.eq(
      erc20PrizeBalanceOfDeployer + leftOverERC20Prize
    );
    expect(await items.balanceOf(deployer.address, 1)).to.eq(
      erc1155PrizeBalanceOfDeployer + leftOverERC1155Prize
    );
  });

  it("Check if revert statements work in the createRaid function", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000);
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10;
    const raidId_1 = await raid.id();

    const battingTokenBalanceOfTeamVault = await latch.balanceOf(
      teamVault.target
    );

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await expect(
      raid.createRaid(
        prizeInfoList,
        raidFee,
        closingTime,
        openingTime,
        maxParticipants
      )
    ).to.revertedWithCustomError(raid, "InvalidTimeRange");

    await expect(
      raid
        .connect(user1)
        .createRaid(
          prizeInfoList,
          raidFee,
          openingTime,
          closingTime,
          maxParticipants
        )
    ).to.reverted;
  });

  it("Check if revert statements work in the joinRaid function", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    let openingTime = Math.floor(new Date().getTime() / 1000);
    let closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    let maxParticipants = 0;
    const raidId_1 = await raid.id();

    const battingTokenBalanceOfTeamVault = await latch.balanceOf(
      teamVault.target
    );

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];
    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );
    await expect(
      raid.connect(user1).joinRaid(raidId_1)
    ).to.revertedWithCustomError(raid, "RaidFull");

    maxParticipants = 10;
    const raidId_2 = await raid.id();
    openingTime = Math.floor(new Date().getTime() / 1000) + 10000;
    closingTime = Math.floor(new Date().getTime() / 1000) + 360000;
    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await expect(
      raid.connect(user1).joinRaid(raidId_2)
    ).to.revertedWithCustomError(raid, "RaidNotReady");

    const raidId_3 = await raid.id();
    openingTime = Math.floor(new Date().getTime() / 1000);
    closingTime = Math.floor(new Date().getTime() / 1000) + 36000;

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );
    await time.increaseTo(closingTime + 1000);
    await raid.complete(raidId_3);

    await expect(
      raid.connect(user1).joinRaid(raidId_3)
    ).to.revertedWithCustomError(raid, "RaidClosed");

    const raidId_4 = await raid.id();

    openingTime = Math.floor(new Date().getTime() / 1000) + 1000;
    closingTime = Math.floor(new Date().getTime() / 1000) + 36000;

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );
    await time.increaseTo(closingTime + 36000);

    await expect(
      raid.connect(user1).joinRaid(raidId_4)
    ).to.revertedWithCustomError(raid, "RaidClosed");
  });

  it("Check if revert statements work in the removeRaid function", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000);
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10;
    const raidId_1 = await raid.id();

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await expect(raid.connect(user1).removeRaid(raidId_1)).to.reverted;
  });

  it("Check if revert statements work in the removeRaid function", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000);
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10;
    const raidId_1 = await raid.id();

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await expect(raid.connect(user1).complete(raidId_1)).to.reverted;
    await raid.complete(raidId_1);
    await expect(raid.complete(raidId_1)).to.revertedWithCustomError(
      raid,
      "RaidClosed"
    );
  });

  it("Check if revert statements work in the claimPrize function", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000);
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 10;
    const raidId_1 = await raid.id();

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await time.increaseTo(openingTime + 1000);
    await raid.connect(user1).joinRaid(raidId_1);

    await expect(
      raid.connect(user1).claimPrize(raidId_1)
    ).to.revertedWithCustomError(raid, "RaidNotCompleted");

    await raid.complete(raidId_1);

    await expect(
      raid.connect(user2).claimPrize(raidId_1)
    ).to.revertedWithCustomError(raid, "UserNotParticipated");

    await raid.connect(user1).claimPrize(raidId_1);

    await expect(
      raid.connect(user1).claimPrize(raidId_1)
    ).to.revertedWithCustomError(raid, "PrizeAlreadyClaimed");
  });

  it("Check if revert statements work in the withdrawLeftoverPrize function", async () => {
    const prizeERC20TokenAmount = ethers.parseEther("100");
    const prizeERC1155TokenAmount = 10n;
    const raidFee = ethers.parseEther("10");

    const openingTime = Math.floor(new Date().getTime() / 1000);
    const closingTime = Math.floor(new Date().getTime() / 1000) + 36000;
    const maxParticipants = 1;
    const raidId_1 = await raid.id();

    const ERC20PrizeInfo = [0, latch.target, 0, prizeERC20TokenAmount];
    const ERC1155PrizeInfo = [1, items.target, 1, prizeERC1155TokenAmount];
    const prizeInfoList = [ERC20PrizeInfo, ERC1155PrizeInfo];

    await raid.createRaid(
      prizeInfoList,
      raidFee,
      openingTime,
      closingTime,
      maxParticipants
    );

    await time.increaseTo(openingTime + 1000);
    await raid.connect(user1).joinRaid(raidId_1);

    await expect(raid.connect(user1).withdrawLeftoverPrize(raidId_1)).to
      .reverted;

    await expect(
      raid.withdrawLeftoverPrize(raidId_1)
    ).to.revertedWithCustomError(raid, "RaidNotCompleted");

    await raid.complete(raidId_1);

    await expect(
      raid.withdrawLeftoverPrize(raidId_1)
    ).to.revertedWithCustomError(raid, "NoRemainingPrize");
  });
});
