// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const GAS_BACK = "0x5d84B43d662CB1787716D4804A6164Efc135FfB6";

module.exports = buildModule("LockModule", (m) => {
  const deployer = m.getAccount(0);
  console.log("deployer", deployer);
  const gameToken = m.contract("GameToken", []);
  const teamVault = m.contract("TeamVault", [GAS_BACK, gameToken, deployer]);
  const items = m.contract("Items", [GAS_BACK, gameToken, deployer, teamVault]);
});
