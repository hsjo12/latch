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

const sortList = (list) => {
  list = Array.from(list);
  return list.sort((a, b) => Number(a) - Number(b));
};

const GAS_BACK = "0x5d84B43d662CB1787716D4804A6164Efc135FfB6";
const MANAGER =
  "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
const SHAPECRAFT_KEY_NFT = "0x05aA491820662b131d285757E5DA4b74BD0F0e5F";

const quantity = 3;
const nftId_0 = 0;
const nftId_1 = 1;
const nftId_2 = 2;

const setUp = async () => {
  const [deployer, user1, user2, user3] = await ethers.getSigners();
  const Latch = await ethers.getContractFactory("Latch");
  const latch = await Latch.deploy();
  const TeamVault = await ethers.getContractFactory("TeamVault");
  const teamVault = await TeamVault.deploy(GAS_BACK, latch.target, deployer);

  const BridgeVault = await ethers.getContractFactory("BridgeVault");
  const bridgeVault = await BridgeVault.deploy();

  const Bridge = await ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy(bridgeVault.target);

  await bridgeVault.grantRole(MANAGER, bridge.target);

  const Items = await ethers.getContractFactory("Items");
  const items = await Items.deploy(
    GAS_BACK,
    latch.target,
    deployer.address,
    teamVault.target
  );

  const shapecraft_key = await ethers.getContractAt(
    "IERC721",
    SHAPECRAFT_KEY_NFT
  );
  const keyHolder = await ethers.getImpersonatedSigner(
    "0xcf58DfE5b2A4e856F5c53F3486CA3870fdD87647"
  );
  const KEY_NFT_IDS = [51, 52, 53];
  await items.registerForGasback();

  // To mint latch
  await latch.grantRole(TOKEN_MINTER, deployer.address);

  // To transfer key nfts
  await user1.sendTransaction({
    value: ethers.parseEther("10"),
    to: keyHolder.address,
  });
  await shapecraft_key
    .connect(keyHolder)
    .safeTransferFrom(keyHolder.address, user1.address, KEY_NFT_IDS[0]);
  await shapecraft_key
    .connect(keyHolder)
    .safeTransferFrom(keyHolder.address, user1.address, KEY_NFT_IDS[1]);

  await shapecraft_key
    .connect(keyHolder)
    .safeTransferFrom(keyHolder.address, user1.address, KEY_NFT_IDS[2]);
  await shapecraft_key.connect(user1).setApprovalForAll(bridge.target, true);

  await Promise.all(
    [user1, user2, user3].map(async (v, i) => {
      await latch.mint(v.address, ethers.parseEther("100000"));
      await latch.connect(v).approve(items.target, ethers.MaxUint256);
      await items.connect(v).mintItems(nftId_0, quantity);
      await items.connect(v).mintItems(nftId_1, quantity);
      await items.connect(v).mintItems(nftId_2, quantity);
      await items.connect(v).setApprovalForAll(bridge.target, true);
    })
  );

  return {
    deployer,
    user1,
    user2,
    user3,
    bridge,
    bridgeVault,
    items,
    shapecraft_key,
  };
};

describe("Items Test", () => {
  let deployer, user1, user2, user3;
  let bridge, items, teamVault, bridgeVault, shapecraft_key;

  beforeEach(async () => {
    ({
      deployer,
      user1,
      user2,
      user3,
      bridge,
      items,
      bridgeVault,
      shapecraft_key,
    } = await loadFixture(setUp));
  });

  it("Check if NFT items (ERC1155) have been imported using the importItem and importItems functions.", async () => {
    await expect(bridge.connect(user1).importItem(items.target, nftId_0))
      .to.emit(bridge, "Import")
      .withArgs(user1.address, items.target, nftId_0);

    await expect(
      bridge
        .connect(user1)
        .importItems(Array(2).fill(items.target), [nftId_1, nftId_2])
    )
      .to.emit(bridge, "Import")
      .withArgs(user1.address, items.target, nftId_1)
      .withArgs(user1.address, items.target, nftId_2);

    expect(await items.balanceOf(bridgeVault.target, nftId_0)).to.eq(1);
    expect(await items.balanceOf(bridgeVault.target, nftId_1)).to.eq(1);
    expect(await items.balanceOf(bridgeVault.target, nftId_2)).to.eq(1);

    expect(
      await bridge.totalImportedUserItem(user1.address, items.target)
    ).to.eq(3);

    expect(
      await bridge.importedUserItemList(user1.address, items.target, 0, 10)
    ).to.deep.eq([nftId_0, nftId_1, nftId_2]);

    expect(await bridge.totalImportedUserItemAddress(user1.address)).to.deep.eq(
      1
    );
    expect(
      await bridge.importedUserItemAddress(user1.address, 0, 10)
    ).to.deep.eq([items.target]);
  });

  it("Check if NFT items (ERC1155) have been exported using the exportItem and exportItems functions.", async () => {
    await bridge
      .connect(user1)
      .importItems(Array(3).fill(items.target), [nftId_0, nftId_1, nftId_2]);
    expect(await items.balanceOf(bridgeVault.target, nftId_0)).to.eq(1);
    expect(await items.balanceOf(bridgeVault.target, nftId_1)).to.eq(1);
    expect(await items.balanceOf(bridgeVault.target, nftId_2)).to.eq(1);

    await expect(bridge.connect(user1).exportItem(items.target, nftId_0))
      .to.emit(bridge, "Export")
      .withArgs(user1.address, items.target, nftId_0);

    expect(await items.balanceOf(bridgeVault.target, nftId_0)).to.eq(0);
    expect(await items.balanceOf(bridgeVault.target, nftId_1)).to.eq(1);
    expect(await items.balanceOf(bridgeVault.target, nftId_2)).to.eq(1);

    expect(
      await bridge.totalImportedUserItem(user1.address, items.target)
    ).to.eq(2);

    expect(
      sortList(
        await bridge.importedUserItemList(user1.address, items.target, 0, 10)
      )
    ).to.deep.eq([nftId_1, nftId_2]);

    expect(await bridge.totalImportedUserItemAddress(user1.address)).to.deep.eq(
      1
    );
    expect(
      await bridge.importedUserItemAddress(user1.address, 0, 10)
    ).to.deep.eq([items.target]);

    await expect(
      bridge
        .connect(user1)
        .exportItems(Array(2).fill(items.target), [nftId_1, nftId_2])
    )
      .to.emit(bridge, "Export")
      .withArgs(user1.address, items.target, nftId_1)
      .withArgs(user1.address, items.target, nftId_2);

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

  it("Check if KEY NFTs (ERC721) have been imported using the importItem and importItems functions.", async () => {
    const KEY_NFT_IDS = [51, 52, 53];
    await expect(
      bridge.connect(user1).importItem(shapecraft_key.target, KEY_NFT_IDS[0])
    )
      .to.emit(bridge, "Import")
      .withArgs(user1.address, shapecraft_key.target, KEY_NFT_IDS[0]);

    expect(await shapecraft_key.balanceOf(bridgeVault.target)).to.eq(1);
    expect(await shapecraft_key.ownerOf(KEY_NFT_IDS[0])).to.eq(
      bridgeVault.target
    );

    await expect(
      bridge
        .connect(user1)
        .importItems(Array(2).fill(shapecraft_key.target), [
          KEY_NFT_IDS[1],
          KEY_NFT_IDS[2],
        ])
    )
      .to.emit(bridge, "Import")
      .withArgs(user1.address, shapecraft_key.target, KEY_NFT_IDS[1])
      .withArgs(user1.address, shapecraft_key.target, KEY_NFT_IDS[2]);
    expect(await shapecraft_key.balanceOf(bridgeVault.target)).to.eq(3);
    expect(await shapecraft_key.ownerOf(KEY_NFT_IDS[1])).to.eq(
      bridgeVault.target
    );
    expect(await shapecraft_key.ownerOf(KEY_NFT_IDS[2])).to.eq(
      bridgeVault.target
    );
    expect(
      await bridge.totalImportedUserItem(user1.address, shapecraft_key.target)
    ).to.eq(3);

    expect(
      await bridge.importedUserItemList(
        user1.address,
        shapecraft_key.target,
        0,
        10
      )
    ).to.deep.eq([KEY_NFT_IDS[0], KEY_NFT_IDS[1], KEY_NFT_IDS[2]]);

    expect(await bridge.totalImportedUserItemAddress(user1.address)).to.deep.eq(
      1
    );
    expect(
      await bridge.importedUserItemAddress(user1.address, 0, 10)
    ).to.deep.eq([shapecraft_key.target]);
  });

  it("Check if KEY NFTs (ERC721) have been exported using the exportItem and exportItems functions.", async () => {
    const KEY_NFT_IDS = [51, 52, 53];

    await bridge
      .connect(user1)
      .importItems(Array(3).fill(shapecraft_key.target), [
        KEY_NFT_IDS[0],
        KEY_NFT_IDS[1],
        KEY_NFT_IDS[2],
      ]);

    expect(await shapecraft_key.balanceOf(bridgeVault.target)).to.eq(3);

    await expect(
      bridge.connect(user1).exportItem(shapecraft_key.target, KEY_NFT_IDS[0])
    )
      .to.emit(bridge, "Export")
      .withArgs(user1.address, shapecraft_key.target, KEY_NFT_IDS[0]);
    expect(await shapecraft_key.balanceOf(bridgeVault.target)).to.eq(2);

    await expect(
      bridge
        .connect(user1)
        .exportItems(Array(2).fill(shapecraft_key.target), [
          KEY_NFT_IDS[1],
          KEY_NFT_IDS[2],
        ])
    )
      .to.emit(bridge, "Export")
      .withArgs(user1.address, shapecraft_key.target, KEY_NFT_IDS[1])
      .withArgs(user1.address, shapecraft_key.target, KEY_NFT_IDS[2]);

    expect(await shapecraft_key.balanceOf(bridgeVault.target)).to.eq(0);

    expect(
      await bridge.totalImportedUserItem(user1.address, shapecraft_key.target)
    ).to.eq(0);
    expect(
      sortList(
        await bridge.importedUserItemList(
          user1.address,
          shapecraft_key.target,
          0,
          10
        )
      )
    ).to.deep.eq([]);
    expect(await bridge.totalImportedUserItemAddress(user1.address)).to.deep.eq(
      0
    );
    expect(
      await bridge.importedUserItemAddress(user1.address, 0, 10)
    ).to.deep.eq([]);
  });

  it.only("Check if revert statements works", async () => {
    await expect(
      bridge.connect(user1).importItem(user2.address, nftId_1)
    ).to.revertedWithCustomError(bridge, "InvalidItemType");

    await expect(
      bridge
        .connect(user1)
        .importItems(Array(2).fill(items.target), [nftId_1, nftId_1])
    ).to.revertedWithCustomError(bridge, "MultipleItemsNotAllowed");

    await expect(
      bridge.connect(user1).exportItem(items.target, nftId_1)
    ).to.revertedWithCustomError(bridge, "NonExistentItem");
  });
});
