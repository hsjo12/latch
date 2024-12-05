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

  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy();

  const Items = await ethers.getContractFactory("Items");
  const items = await Items.deploy(
    GAS_BACK,
    gameToken.target,
    deployer.address,
    teamVault.target
  );

  await items.registerForGasback();

  await Promise.all(
    [user1, user2, user3].map(async (v) => {
      const randomItemTypes = generateRandomItemTypesArray(5);
      const stats = generateRandomStatsArray(randomItemTypes);
      await items.mintItems(v.address, randomItemTypes, stats);
      await items.connect(v).setApprovalForAll(bridge.target, true);
    })
  );

  return {
    deployer,
    user1,
    user2,
    user3,
    bridge,
    items,
  };
};

describe("Items Test", () => {
  let deployer, user1, user2, user3;
  let bridge, items, teamVault;

  beforeEach(async () => {
    ({ deployer, user1, user2, user3, bridge, items } = await loadFixture(
      setUp
    ));
  });

  it("Check if importItem and importItems works fine", async () => {
    const itemIdsOfUser1 = await items.tokensOfOwner(user1.address);

    await expect(
      bridge.connect(user1).importItem(items.target, itemIdsOfUser1[0])
    )
      .to.emit(bridge, "Import")
      .withArgs(user1.address, items.target, itemIdsOfUser1[0]);

    await expect(
      bridge
        .connect(user1)
        .importItems(Array(3).fill(items.target), [
          itemIdsOfUser1[1],
          itemIdsOfUser1[2],
          itemIdsOfUser1[3],
        ])
    )
      .to.emit(bridge, "Import")
      .withArgs(user1.address, items.target, itemIdsOfUser1[1])
      .withArgs(user1.address, items.target, itemIdsOfUser1[2])
      .withArgs(user1.address, items.target, itemIdsOfUser1[3]);

    expect(await items.tokensOfOwner(bridge.target)).to.deep.eq([
      itemIdsOfUser1[0],
      itemIdsOfUser1[1],
      itemIdsOfUser1[2],
      itemIdsOfUser1[3],
    ]);

    expect(
      await bridge.totalImportedUserItem(user1.address, items.target)
    ).to.eq(4);
    expect(
      await bridge.importedUserItemList(user1.address, items.target, 0, 10)
    ).to.deep.eq([
      itemIdsOfUser1[0],
      itemIdsOfUser1[1],
      itemIdsOfUser1[2],
      itemIdsOfUser1[3],
    ]);
    expect(await bridge.totalImportedUserItemAddress(user1.address)).to.deep.eq(
      1
    );
    expect(
      await bridge.importedUserItemAddress(user1.address, 0, 10)
    ).to.deep.eq([items.target]);
  });
  it("Check if exportItem and exportItems works fine", async () => {
    const itemIdsOfUser1 = await items.tokensOfOwner(user1);
    await bridge
      .connect(user1)
      .importItems(Array(4).fill(items.target), [
        itemIdsOfUser1[0],
        itemIdsOfUser1[1],
        itemIdsOfUser1[2],
        itemIdsOfUser1[3],
      ]);

    console.log(
      "await items.ownerOf(itemIdsOfUser1[0])",
      await items.ownerOf(itemIdsOfUser1[0])
    );
    console.log("bridge", bridge.target);
    await expect(
      bridge.connect(user1).exportItem(items.target, itemIdsOfUser1[0])
    )
      .to.emit(bridge, "Export")
      .withArgs(user1.address, items.target, itemIdsOfUser1[0]);

    expect(
      await bridge.totalImportedUserItem(user1.address, items.target)
    ).to.eq(3);
    expect(
      sortList(
        await bridge.importedUserItemList(user1.address, items.target, 0, 10)
      )
    ).to.deep.eq([itemIdsOfUser1[1], itemIdsOfUser1[2], itemIdsOfUser1[3]]);

    expect(await bridge.totalImportedUserItemAddress(user1.address)).to.deep.eq(
      1
    );
    expect(
      await bridge.importedUserItemAddress(user1.address, 0, 10)
    ).to.deep.eq([items.target]);

    await expect(
      bridge
        .connect(user1)
        .exportItems(Array(3).fill(items.target), [
          itemIdsOfUser1[1],
          itemIdsOfUser1[2],
          itemIdsOfUser1[3],
        ])
    )
      .to.emit(bridge, "Export")
      .withArgs(user1.address, items.target, 1)
      .withArgs(user1.address, items.target, 2)
      .withArgs(user1.address, items.target, 3);

    expect(
      await bridge.totalImportedUserItem(user1.address, items.target)
    ).to.eq(0);
    expect(
      sortList(
        await bridge.importedUserItemList(user1.address, items.target, 0, 10)
      )
    ).to.deep.eq([]);
    expect(await bridge.totalImportedUserItemAddress(user1.address)).to.deep.eq(
      0
    );
    expect(
      await bridge.importedUserItemAddress(user1.address, 0, 10)
    ).to.deep.eq([]);
  });
});
