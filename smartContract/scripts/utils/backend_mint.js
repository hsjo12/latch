const { ethers } = require("ethers");
const itemJson = require("../../artifacts/contracts/items/Items.sol/Items.json");
// Your contract's ABI

// Contract address and provider
const itemAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Replace with your contract's address
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/"); // Replace with your RPC provider (Infura, Alchemy, etc.)
const signer = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);
// Initialize the contract instance
const contract = new ethers.Contract(itemAddress, itemJson.abi, signer);

// Set to store processed transaction hashes
let processedTxHashes = new Set();

// Listen to the RequiredMints event
contract.on("RequiredMints", async (user, quantity) => {
  console.log(
    `Received RequiredMints event for user: ${user} with quantity: ${quantity}`
  );

  const receiver = user;
  const randomItemTypes = generateRandomItemTypesArray(Number(quantity));
  const stats = generateRandomStatsArray(randomItemTypes);

  try {
    const tx = await contract.mintItems(receiver, randomItemTypes, stats);

    // Get the transaction hash (this will be unique for each transaction)
    const txHash = tx.hash;

    // Check if the transaction hash has been processed before
    if (processedTxHashes.has(txHash)) {
      console.log(
        `Transaction with hash ${txHash} has already been processed. Skipping.`
      );
      return; // Skip this transaction
    }

    // Add the transaction hash to the set to track processed transactions
    processedTxHashes.add(txHash);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    if (receipt && receipt.status == 1) {
      console.log(`Transaction ${txHash} is successful`);
    } else {
      console.log(`Transaction ${txHash} failed`);
    }
  } catch (error) {
    console.error(`Error during minting for user ${user}:`, error);
  }
});

console.log("Listening for RequiredMints events...");

function generateRandomItemTypesArray(count) {
  const itemTypes = Array.from({ length: count }, () =>
    Math.floor(Math.random() * 3)
  );
  return itemTypes;
}

function generateRandomStatsArray(itemTypes) {
  const stats = itemTypes.map((itemType) => {
    let atk, def, speed;

    if (itemType === 0) {
      // Weapon
      atk = Math.floor(Math.random() * 100) + 1; // atk: 1~100
      def = 0; // def: 0
      speed = Math.floor(Math.random() * 11) * -1; // speed: 0~-10
    } else if (itemType === 1) {
      // Armour
      atk = 0; // atk: 0
      def = Math.floor(Math.random() * 100) + 1; // def: 1~100
      speed = Math.floor(Math.random() * 11) * -1; // speed: 0~-10
    } else if (itemType === 2) {
      // Boots
      atk = 0; // atk: 0
      def = Math.floor(Math.random() * 10) + 1; // def: 1~10
      speed = Math.floor(Math.random() * 51); // speed: 0~50
    }

    // durability: 20~100
    const durability = Math.floor(Math.random() * 80) + 20;

    return [atk, def, speed, durability];
  });

  return stats;
}
