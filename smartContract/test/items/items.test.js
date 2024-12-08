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

  it("Check if only TOKEN_MINTER role can mint items", async () => {
    const swordStats = [10, 10, 0, 100];
    const shieldStats = [0, 100, 0, 100];
    const bootsStats = [0, 0, 100, 100];

    await items.setItemStats([1, 2, 3], [swordStats, shieldStats, bootsStats]);
    expect(await items.getItemInfoList([1, 2, 3])).to.deep.eq([
      swordStats,
      shieldStats,
      bootsStats,
    ]);
  });

  it("Check if User can mint items", async () => {
    const price = await items.price();
    const quantity = 2n;
    const totalPrice = price * quantity;
    const nftId = 1;

    const tokenBalanceOfTeamVault = await gameToken.balanceOf(teamVault.target);
    const tokenBalanceOfUser1 = await gameToken.balanceOf(user1.address);
    const itemBalanceOfUser1 = await items.balanceOf(user1.address, nftId);
    await items.connect(user1).mintItems(nftId, quantity);

    expect(await gameToken.balanceOf(user1.address)).to.eq(
      tokenBalanceOfUser1 - totalPrice
    );
    expect(await gameToken.balanceOf(teamVault.target)).to.eq(
      tokenBalanceOfTeamVault + totalPrice
    );
    expect(await items.balanceOf(user1.address, nftId)).to.eq(
      itemBalanceOfUser1 + quantity
    );
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

    //setBaseURI
    const id = 1;
    const newTokenURI = "newTokenURI/";
    await items.setBaseURI(newTokenURI);
    expect(await items.baseURI()).to.eq(newTokenURI);
    expect(await items.uri(id)).to.eq(`${newTokenURI}${id}.json`);
    await expect(items.connect(user1).setBaseURI(newTokenURI)).to.reverted;
  });
});
