require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 10000,
        details: {
          yulDetails: {
            optimizerSteps: "u",
          },
        },
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://shape-mainnet.g.alchemy.com/v2/${process.env.KEY}`,
      },
    },

    shape: {
      url: `https://shape-mainnet.g.alchemy.com/v2/${process.env.KEY}`,
      chainId: 360,
      accounts: [process.env.PK],
    },

    shape_sepolia: {
      url: `https://shape-sepolia.g.alchemy.com/v2/${process.env.KEY}`,
      chainId: 11011,
      accounts: [process.env.PK],
    },
  },
  mocha: {
    timeout: 10000000000000,
  },
};
