const { ethers } = require("hardhat");
const MANAGER =
  "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
const LATCH_ADDRESS = "0x1c6d87af805849F930Cee5fEd41a74e8623A44E2";
const TOKEN_MARKET_ADDRESS = "0xb955c17583D5567A82AF76c96019ee0491Fe7721";
const ITEMS_ADDRESS = "0x970519c725E72301f025A1d0aB9E91C547bFd91a";
const BRIDGE_ADDRESS = "0xe59A36716dc801e605a343bBC0d901de828A7C5a";
const BRIDGE_VAULT_ADDRESS = "0x4B7d08A8aa0D09B2EE8ECE7EA00a2D2c6Fde2931";
const PVP_ADDRESS = "0x386C282eA682e9df5B4A208fB63F2Ecc57F4c514";
const PVP_VAULT_ADDRESS = "0x7d63B3933e42224355fD58f9967F9D183B92B2C7";
const TEAM_VAULT_ADDRESS = "0xf491c42Ebe4B5183253E099521E54AaBdA2F1D39";
const getETHFromTokens = (pricePerTokenInETH, tokenAmount) => {
  const requiredValue =
    (pricePerTokenInETH * tokenAmount) / ethers.parseEther("1");
  return requiredValue;
};

async function main() {
  const [userA, userB, server] = await ethers.getSigners();
  const DEPLOYER = await ethers.getImpersonatedSigner(
    "0xD36412B1E3042D33E7A9Ba35ca3952bA9e4f019F"
  );

  const latch = await ethers.getContractAt("Latch", LATCH_ADDRESS);
  const tokenMarket = await ethers.getContractAt(
    "TokenMarket",
    TOKEN_MARKET_ADDRESS
  );
  const items = await ethers.getContractAt("Items", ITEMS_ADDRESS);
  const bridge = await ethers.getContractAt("Bridge", BRIDGE_ADDRESS);
  const bridgeVault = await ethers.getContractAt(
    "BridgeVault",
    BRIDGE_VAULT_ADDRESS
  );
  const pvp = await ethers.getContractAt("Pvp", PVP_ADDRESS);
  const pvpVault = await ethers.getContractAt("PvpVault", PVP_VAULT_ADDRESS);

  await pvp.connect(DEPLOYER).grantRole(MANAGER, server.address);
  // Buy Latch tokens
  const pricePerTokenInETH = await tokenMarket.pricePerToken();

  console.log("Step1. Buy and Sell Latch");
  console.log("                                     ");
  console.log("                                     ");
  console.log(
    `LAtch balance Of User A:${ethers.formatEther(
      await latch.balanceOf(userA.address)
    )} Latch`
  );
  console.log(
    `LAtch balance Of User B:${ethers.formatEther(
      await latch.balanceOf(userB.address)
    )} Latch`
  );

  console.log("                                     ");
  console.log(`User A is trying to buy 1000 $Latch...`);
  console.log(`User B is trying to buy 2000 $Latch...`);
  console.log("                                     ");

  const BuyAmount_UserA = ethers.parseEther("1000");
  let requiredETH = getETHFromTokens(pricePerTokenInETH, BuyAmount_UserA);
  await tokenMarket
    .connect(userA)
    .buyToken(BuyAmount_UserA, { value: requiredETH });

  const BuyAmount_UserB = ethers.parseEther("2000");
  requiredETH = getETHFromTokens(pricePerTokenInETH, BuyAmount_UserB);
  await tokenMarket
    .connect(userB)
    .buyToken(BuyAmount_UserB, { value: requiredETH });

  console.log(
    `Latch balance Of User A:${ethers.formatEther(
      await latch.balanceOf(userA.address)
    )} Latch`
  );
  console.log(
    `Latch balance Of User B:${ethers.formatEther(
      await latch.balanceOf(userB.address)
    )} Latch`
  );

  console.log("                                     ");
  console.log("                                     ");
  console.log(
    `ETH balance Of User B:${ethers.formatEther(
      await ethers.provider.getBalance(userB.address)
    )} ETH`
  );
  console.log(
    `Latch balance Of User B:${ethers.formatEther(
      await latch.balanceOf(userB.address)
    )} Latch`
  );
  console.log(`User B is trying to sell 1000 $Latch...`);
  const SoldAmount_UserB = ethers.parseEther("1000");

  await latch.connect(userB).approve(tokenMarket.target, ethers.MaxUint256);
  await tokenMarket.connect(userB).sellToken(SoldAmount_UserB);
  console.log(
    `ETH balance Of User B:${ethers.formatEther(
      await ethers.provider.getBalance(userB.address)
    )} ETH`
  );
  console.log(
    `Latch balance Of User B:${ethers.formatEther(
      await latch.balanceOf(userB.address)
    )} Latch`
  );
  console.log("                                     ");
  console.log("                                     ");

  console.log("Step2. Buy items");
  console.log("                                     ");
  console.log("                                     ");

  console.log(
    `Latch balance Of User A:${ethers.formatEther(
      await latch.balanceOf(userA.address)
    )} Latch`
  );
  console.log(`User A buys a Sword with 300 Latch`);
  const Sword_id = 0;
  const quantity = 1;
  await latch.connect(userA).approve(items.target, ethers.MaxUint256);
  await items.connect(userA).mintItems(Sword_id, quantity);

  console.log(
    `Sword NFT balance of UserA: ${await items.balanceOf(
      userA.address,
      Sword_id
    )}`
  );
  console.log(
    `Sword NFT balance of UserB: ${await items.balanceOf(
      userB.address,
      Sword_id
    )}`
  );
  console.log("                                     ");
  const swordInfo = await items.itemInfo(Sword_id);
  console.log(swordInfo);
  console.log(swordInfo.stats);
  const [atk, def, spd, dur] = swordInfo.stats;
  console.log(
    `Sword NFT Stat: attack:${atk} defense:${def} speed:${spd} durability:${dur}`
  );

  console.log("                                     ");
  console.log("                                     ");
  console.log("Step3. Import items");
  console.log("                                     ");

  console.log(
    `Sword NFT balance of UserA: ${await items.balanceOf(
      userA.address,
      Sword_id
    )}`
  );
  console.log(
    `Sword NFT balance of bridge vault: ${await items.balanceOf(
      bridgeVault.target,
      Sword_id
    )}`
  );
  console.log("UserA is trying to import a Sword to the bridge");
  await items.connect(userA).setApprovalForAll(bridge.target, true);
  await bridge.connect(userA).importItem(items.target, Sword_id);
  console.log(
    `Sword NFT balance of UserA: ${await items.balanceOf(
      userA.address,
      Sword_id
    )}`
  );
  console.log(
    `Sword NFT balance of bridge vault: ${await items.balanceOf(
      bridgeVault.target,
      Sword_id
    )}`
  );
  console.log("                                     ");
  console.log("                                     ");
  console.log(`Check What item UserA import`);
  console.log(`Item address : ${items.target}`);

  console.log("                                     ");
  console.log("                                     ");
  console.log("Step4. Pvp");
  console.log("                                     ");

  console.log(
    `Latch balance Of UserA:${ethers.formatEther(
      await latch.balanceOf(userA.address)
    )} Latch`
  );
  console.log(
    `Latch balance Of UserB:${ethers.formatEther(
      await latch.balanceOf(userB.address)
    )} Latch`
  );

  console.log("                                     ");
  console.log("                                     ");
  console.log(`${ethers.formatEther(await latch.balanceOf(pvpVault))}Latch`);
  console.log(`UserA is creating a PvP room, betting 300 Latch`);
  await latch.connect(userA).approve(pvp.target, ethers.MaxUint256);
  await pvp.connect(userA).createPvp(await ethers.parseEther("300"));
  const roomId = await pvp.pvpByUser(userA.address);
  console.log(`Room is created by UserA (Room id: ${roomId})`);
  console.log("                                     ");
  console.log(
    `UserB is joining a PvP room(Room id:${roomId}), betting 300 Latch`
  );
  await latch.connect(userB).approve(pvp.target, ethers.MaxUint256);
  await pvp.connect(userB).joinPvp(roomId);

  console.log(`All the batting tokens is stored in PvpVault`);
  console.log(
    `Latch balance Of Pvp: ${ethers.formatEther(
      await latch.balanceOf(pvpVault)
    )}Latch`
  );
  console.log("                                     ");
  console.log("                                     ");
  console.log("                                     ");
  console.log(`UserA and UserB is fight in the game.`);
  console.log(
    `Finally, a winner has appeared. The server will execute the announce function to store the winner's address and distribute the rewards.`
  );
  console.log("                                     ");
  console.log("                                     ");
  console.log("                                     ");

  console.log(
    `Latch balance Of UserA:${ethers.formatEther(
      await latch.balanceOf(userA.address)
    )} Latch`
  );
  console.log(
    `Latch balance Of UserB:${ethers.formatEther(
      await latch.balanceOf(userB.address)
    )} Latch`
  );

  console.log("                                     ");
  console.log(`The Winner is UserA since userA used sword in the battle`);
  console.log("                                     ");
  console.log(`The game server will execute the announce function`);
  console.log("                                     ");
  await pvp.connect(server).announce(userA.address, roomId);
  console.log(
    `Latch balance Of Pvp: ${ethers.formatEther(
      await latch.balanceOf(pvpVault)
    )}Latch`
  );
  console.log(
    `Latch balance Of UserA:${ethers.formatEther(
      await latch.balanceOf(userA.address)
    )} Latch`
  );
  console.log(
    `Latch balance Of UserB:${ethers.formatEther(
      await latch.balanceOf(userB.address)
    )} Latch`
  );

  console.log(
    `Latch balance Of Pvp: ${ethers.formatEther(
      await latch.balanceOf(pvpVault)
    )}Latch`
  );
  console.log(
    `Latch balance Of TeamVault: ${ethers.formatEther(
      await latch.balanceOf(TEAM_VAULT_ADDRESS)
    )}Latch`
  );

  console.log("                                     ");
  console.log("                                     ");
  console.log("Step5. Export items");
  console.log("                                     ");
  console.log(
    `Sword NFT balance of User A ${await items.balanceOf(
      userA.address,
      Sword_id
    )}`
  );
  console.log(
    `Sword NFT balance of bridge vault ${await items.balanceOf(
      bridgeVault.target,
      Sword_id
    )}`
  );
  console.log("UserA is trying to export a Sword to the bridge");
  await bridge.connect(userA).exportItem(items.target, Sword_id);
  console.log(
    `Sword NFT balance of UserA ${await items.balanceOf(
      userA.address,
      Sword_id
    )}`
  );
  console.log(
    `Sword NFT balance of bridge vault ${await items.balanceOf(
      bridgeVault.target,
      Sword_id
    )}`
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
