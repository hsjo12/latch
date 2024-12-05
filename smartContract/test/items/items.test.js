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
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
const GAS_BACK = "0x5d84B43d662CB1787716D4804A6164Efc135FfB6";

const setUp = async () => {
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();

  const TeamVault = await ethers.getContractFactory("TeamVault");
  const teamVault = await TeamVault.deploy(
    GAS_BACK,
    gameToken.target,
    deployer
  );

  const Items = await ethers.getContractFactory("Items");
  const items = await Items.deploy(
    GAS_BACK,
    gameToken.target,
    deployer.address,
    teamVault.target
  );

  await gameToken.grantRole(TOKEN_MINTER, deployer.address);
  await items.registerForGasback();
  await Promise.all(
    [user1, user2, user3].map(async (v) => {
      await gameToken.connect(v).approve(items.target, ethers.MaxUint256);
      await gameToken.mint(v.address, ethers.parseEther("1000"));
    })
  );

  return {
    deployer,
    user1,
    user2,
    user3,
    gameToken,
    items,
    teamVault,
  };
};

describe("Items Test", () => {
  let deployer, user1, user2, user3;
  let gameToken, items, teamVault;

  beforeEach(async () => {
    ({ deployer, user1, user2, user3, gameToken, items, teamVault } =
      await loadFixture(setUp));
  });

  it("Check if values in constructor", async () => {
    expect(await gameToken.target).to.eq(await items.gameToken());
    expect(await teamVault.target).to.eq(await items.teamVault());
    expect(GAS_BACK).to.eq(await items.gasback());
  });

  it("Check if User can mint items", async () => {
    const price = await items.price();
    const quantity = 2n;
    const totalPrice = price * quantity;

    const tokenBalanceOfTeamVault = await gameToken.balanceOf(teamVault.target);
    const tokenBalanceOfUser1 = await gameToken.balanceOf(user1.address);
    const itemBalanceOfUser1 = await items.balanceOf(user1.address);

    await expect(items.connect(user1).requireMint(quantity))
      .to.emit(items, "MintRequested")
      .withArgs(user1.address, quantity);

    const receiver = user1.address;
    const randomItemTypes = generateRandomItemTypesArray(Number(quantity));
    const stats = generateRandomStatsArray(randomItemTypes);

    await expect(items.mintItems(receiver, randomItemTypes, stats))
      .to.emit(items, "ItemMinted")
      .withArgs(user1.address, quantity);

    expect(await gameToken.balanceOf(user1.address)).to.eq(
      tokenBalanceOfUser1 - totalPrice
    );
    expect(await gameToken.balanceOf(teamVault.target)).to.eq(
      tokenBalanceOfTeamVault + totalPrice
    );
    expect(await items.balanceOf(user1.address)).to.eq(
      itemBalanceOfUser1 + quantity
    );
  });

  it("Check if only TOKEN_MINTER role can mint items", async () => {
    const quantity = 3n;
    const receiver = user1.address;
    const randomItemTypes = generateRandomItemTypesArray(Number(quantity));
    const stats = generateRandomStatsArray(randomItemTypes);

    await expect(
      items.connect(user1).mintItems(receiver, randomItemTypes, stats)
    ).to.reverted;
  });

  it("Check if only MANAGER or DEFAULT_ADMIN_ROLE role can execute setPrice, setOwner, setTeamVault, setGameToken and setTokenURIById", async () => {
    //setPrice
    const newPrice = ethers.parseEther("10");
    await items.setPrice(newPrice);
    expect(newPrice).to.eq(await items.price());
    await expect(items.connect(user1).setPrice(newPrice)).to.reverted;

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

    //setGameToken
    const newGameToken = user1.address;
    await items.setGameToken(newGameToken);
    expect(newGameToken).to.eq(await items.gameToken());
    await expect(items.connect(user1).setGameToken(newGameToken)).to.reverted;

    //setTokenURIById
    const newTokenURI = "newTokenURI";
    await items.setTokenURIById(1, newTokenURI);
    expect(newTokenURI).to.eq(await items.tokenURIByItemType(1));
    await expect(items.connect(user1).setTokenURIById(1, newTokenURI)).to
      .reverted;
  });

  it("Check if setTokenURIById and tokenURI work well", async () => {
    const price = await items.price();
    const quantity = 3n;

    const newTokenURI = "newTokenURI";
    await items.setTokenURIById(0, `${newTokenURI}0`);
    await items.setTokenURIById(1, `${newTokenURI}1`);
    await items.setTokenURIById(2, `${newTokenURI}2`);

    const receiver = user1.address;
    const randomItemTypes = generateRandomItemTypesArray(Number(quantity));
    const stats = generateRandomStatsArray(randomItemTypes);

    await items.mintItems(receiver, randomItemTypes, stats);

    const info = await items.getItemInfoList([0, 1, 2]);
    await expect(info[0]).to.deep.eq([randomItemTypes[0], stats[0]]);
    await expect(info[1]).to.deep.eq([randomItemTypes[1], stats[1]]);
    await expect(info[2]).to.deep.eq([randomItemTypes[2], stats[2]]);

    const tokenId0_ItemType = randomItemTypes[0];
    const tokenId1_ItemType = randomItemTypes[1];
    const tokenId2_ItemType = randomItemTypes[2];

    expect(await items.tokenURI(0)).to.eq(`newTokenURI${tokenId0_ItemType}`);
    expect(await items.tokenURI(1)).to.eq(`newTokenURI${tokenId1_ItemType}`);
    expect(await items.tokenURI(2)).to.eq(`newTokenURI${tokenId2_ItemType}`);
  });
});
