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
  gasReporter: {
    currency: "ETH",
    enabled: false,
    coinmarketcap: process.env.CMC_KEY,
  },

  networks: {
    hardhat: {
      forking: {
        url: `https://shape-mainnet.g.alchemy.com/v2/${process.env.KEY}`,
      },
    },

    // eth: {
    //   url: "https://eth-mainnet.g.alchemy.com/v2/ciI0Q84GRMOMJgY6ZJc33uUPQG6th-JR",
    //   chainId: 1,
    //   accounts: [process.env.PK],
    // },
  },

  mocha: {
    timeout: 10000000000000,
  },
};
