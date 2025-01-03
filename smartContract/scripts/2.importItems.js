const { ethers } = require("hardhat");

const ITEMS_ADDRESS = "";
const BRIDGE_ADDRESS = "";
const IMPORTED_NFT_ID = 0;

async function main() {
  const [deployer] = await ethers.getSigners();

  const items = await ethers.getContractAt("Items", ITEMS_ADDRESS);

  const bridge = await ethers.getContractAt("Bridge", BRIDGE_ADDRESS);
  const balance = await items.balanceOf(deployer.address, IMPORTED_NFT_ID);
  if (balance === 0n) return console.log("You do not have the Item");

  console.log(`Now import item...`);
  await items.setApprovalForAll(bridge.target, true);
  await bridge.importItem(items.target, IMPORTED_NFT_ID);

  const totalIdsInOneNFT = await bridge.totalImportedUserItem(
    deployer.address,
    items.target
  );
  const itemsIdsInOneNFT = await bridge.importedUserItemList(
    deployer.address, // user
    items.target, // item
    0, // offset
    10 // size
  );

  console.log(
    `Total number of imported IDs in One Item Contract: ${totalIdsInOneNFT}`
  );
  console.log(`List of imported IDs in One Item Contract: ${itemsIdsInOneNFT}`);

  const totalNFTs = await bridge.totalImportedUserItemAddress(deployer.address);
  const importedNFTAddresses = await bridge.importedUserItemAddress(
    deployer.address, // user
    0, // offset
    10 // size
  );

  console.log(`Total number of imported Item Contracts: ${totalNFTs}`);
  console.log(`List of imported Item Contracts: ${importedNFTAddresses}`);

  const isUserHold = await bridge.userHasItem(deployer.address, items.target);
  console.log(
    `Check if a user transfer one of item NFT to the bridge: ${isUserHold}`
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/*
Change NFT erc1155
*/
