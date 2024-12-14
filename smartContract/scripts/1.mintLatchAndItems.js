const { ethers } = require("hardhat");

const LATCH_ADDRESS = "";
const TOKEN_MARKET_ADDRESS = "";
const ITEMS_ADDRESS = "";
const TOKEN_AMOUNT = ethers.parseEther("1000");
const NFT_ID = 0;
const QUANTITY = 10;

const getRequiredETH = (pricePerTokenInETH, tokenAmount) => {
  return (pricePerTokenInETH * tokenAmount) / ethers.parseEther("1");
};

async function main() {
  const [deployer] = await ethers.getSigners();

  const latch = await ethers.getContractAt("Latch", LATCH_ADDRESS);
  const tokenMarket = await ethers.getContractAt(
    "TokenMarket",
    TOKEN_MARKET_ADDRESS
  );
  const items = await ethers.getContractAt("Items", ITEMS_ADDRESS);

  // Buy Latch tokens
  const pricePerTokenInETH = await tokenMarket.pricePerToken();
  const requiredETH = getRequiredETH(pricePerTokenInETH, TOKEN_AMOUNT);
  await tokenMarket.buyToken(TOKEN_AMOUNT, { value: requiredETH });

  const latchBalance = ethers.formatEther(
    await latch.balanceOf(deployer.address)
  );
  console.log(`User receives $${latchBalance} Latch.`);

  // Buy Items with Latch tokens
  await latch.approve(items.target, ethers.MaxUint256);
  await items.mintItems(NFT_ID, QUANTITY);

  const itemBalance = await items.balanceOf(deployer.address, NFT_ID);
  console.log(
    `NFT with ID ${NFT_ID} has been minted for a total of ${itemBalance}.`
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/*
Change NFT erc1155
*/
