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

const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
const GAS_BACK = "0x5d84B43d662CB1787716D4804A6164Efc135FfB6";

const SWORD_STATS = [10, 10, 0, 100];
const SHIELD_STATS = [0, 100, 0, 100];
const BOOTS_STATS = [0, 0, 100, 100];

const PRICE_LIST = [
  ethers.parseEther("1"),
  ethers.parseEther("0.1"),
  ethers.parseEther("0.01"),
];

const setUp = async () => {
  const [deployer, user1, user2, user3] = await ethers.getSigners();
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

  await latch.grantRole(TOKEN_MINTER, deployer.address);
  await items.registerForGasback();
  await items.initializeItems([1, 2, 3], PRICE_LIST, [
    SWORD_STATS,
    SHIELD_STATS,
    BOOTS_STATS,
  ]);
  await Promise.all(
    [user1, user2, user3].map(async (v) => {
      await latch.connect(v).approve(items.target, ethers.MaxUint256);
      await latch.mint(v.address, ethers.parseEther("1000"));
    })
  );

  return {
    deployer,
    user1,
    user2,
    user3,
    latch,
    items,
    teamVault,
  };
};

describe("Items Test", () => {
  let deployer, user1, user2, user3;
  let latch, items, teamVault;

  beforeEach(async () => {
    ({ deployer, user1, user2, user3, latch, items, teamVault } =
      await loadFixture(setUp));
  });

  it("Check if values in constructor are correct", async () => {
    expect(await latch.target).to.eq(await items.token());
    expect(await teamVault.target).to.eq(await items.teamVault());
    expect(GAS_BACK).to.eq(await items.gasback());
  });

  it("Check if only TOKEN_MINTER role can mint items", async () => {
    const expectedItemInfoList = [
      [SWORD_STATS, PRICE_LIST[0], true],
      [SHIELD_STATS, PRICE_LIST[1], true],
      [BOOTS_STATS, PRICE_LIST[2], true],
    ];
    await items.initializeItems([1, 2, 3], PRICE_LIST, [
      SWORD_STATS,
      SHIELD_STATS,
      BOOTS_STATS,
    ]);
    expect(await items.getItemInfoList([1, 2, 3])).to.deep.eq(
      expectedItemInfoList
    );
  });

  it("Check if User can mint items", async () => {
    const nftId = 1;
    const price = (await items.getPriceList([nftId]))[0];
    const quantity = 2n;

    const totalPrice = price * quantity;

    const tokenBalanceOfTeamVault = await latch.balanceOf(teamVault.target);
    const tokenBalanceOfUser1 = await latch.balanceOf(user1.address);
    const itemBalanceOfUser1 = await items.balanceOf(user1.address, nftId);
    await items.connect(user1).mintItems(nftId, quantity);

    expect(await latch.balanceOf(user1.address)).to.eq(
      tokenBalanceOfUser1 - totalPrice
    );
    expect(await latch.balanceOf(teamVault.target)).to.eq(
      tokenBalanceOfTeamVault + totalPrice
    );
    expect(await items.balanceOf(user1.address, nftId)).to.eq(
      itemBalanceOfUser1 + quantity
    );
  });

  it("Check if only MANAGER or DEFAULT_ADMIN_ROLE role can execute setPrice, setOwner, setTeamVault, setToken and setTokenURIById", async () => {
    //setPrice
    const nftId = 1;
    const newPrice = ethers.parseEther("10");
    await items.setPrices([nftId], [newPrice]);

    expect(newPrice).to.eq((await items.getPriceList([nftId]))[0]);
    await expect(items.connect(user1).setPrices([nftId], [newPrice])).to
      .reverted;

    // setStats
    const newStats = [0n, 0n, 0n, 0n];
    await items.setStats([nftId], [newStats]);
    const fetchedStats = (await items.getStatList([nftId]))[0];
    expect(newStats).to.deep.eq(fetchedStats);
    await expect(items.connect(user1).setStats([nftId], [newStats])).to
      .reverted;

    //setOwner
    const newOwner = user1.address;
    await items.setOwner(newOwner);
    expect(newOwner).to.eq(await items.owner());
    await expect(items.connect(user1).setOwner(newOwner)).to.reverted;

    //setTeamVault
    const newTeamVault = user1.address;
    await items.setTeamVault(newTeamVault);
    expect(newTeamVault).to.eq(await items.teamVault());
    await expect(items.connect(user1).setTeamVault(newTeamVault)).to.reverted;

    //setToken
    const newToken = user1.address;
    await items.setToken(newToken);
    expect(newToken).to.eq(await items.token());
    await expect(items.connect(user1).setToken(newToken)).to.reverted;

    //setBaseURI
    const id = 1;
    const newTokenURI = "newTokenURI/";
    await items.setBaseURI(newTokenURI);
    expect(await items.baseURI()).to.eq(newTokenURI);
    expect(await items.uri(id)).to.eq(`${newTokenURI}${id}.json`);
    await expect(items.connect(user1).setBaseURI(newTokenURI)).to.reverted;
  });

  it("Check if the UnregisteredItem error is reverted in mintItems, setPrices, and setStats", async () => {
    const uninitializedItemId = 100;
    const newPrice = ethers.parseEther("1");
    const newStats = [0, 0, 0, 0];
    await expect(
      items.mintItems(uninitializedItemId, 10)
    ).to.be.revertedWithCustomError(items, "UnregisteredItem");
    await expect(
      items.setPrices([uninitializedItemId], [newPrice])
    ).to.be.revertedWithCustomError(items, "UnregisteredItem");
    await expect(
      items.setStats([uninitializedItemId], [newStats])
    ).to.be.revertedWithCustomError(items, "UnregisteredItem");
  });
});
