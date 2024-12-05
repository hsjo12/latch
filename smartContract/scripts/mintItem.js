const { ethers } = require("hardhat");
const TOKEN_MINTER =
  "0x262c70cb68844873654dc54487b634cb00850c1e13c785cd0d96a2b89b829472";
async function main() {
  const [deployer, user1] = await ethers.getSigners();
  const gameToken = await ethers.getContractAt(
    "GameToken",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
  const items = await ethers.getContractAt(
    "Items",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  );

  //   await gameToken.grantRole(TOKEN_MINTER, deployer.address);
  //   await gameToken.mint(deployer.address, ethers.parseEther("1000"));
  //   await gameToken.approve(items.target, ethers.MaxUint256);
  //   await items.requireMint(3);

  console.log(await items.getItemInfoList([1, 2, 3]));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
