# Latch

[LIVE DEMO LATCH](https://latch.netlify.app/)

Latch is a transparent, blockchain-based gaming platform that allows users to socialize and enjoy engaging features such as PvP and raid systems. It is open to integration with existing projects, providing them with unique privileges. In the future, various projects will be able to transfer their NFTs to Latch's bridge contract for use within the game.

Built with:

- [Next.js](https://nextjs.org)
- [JavaScript](https://www.javascript.com/)
- [Hardhat](https://hardhat.org)
- [Ethers.js](https://docs.ethers.io/v6/)
- [Reown](https://reown.com/)
- [Alchemy](https://www.alchemy.com/)
- [Node](https://nodejs.org/en/download/)
- [Git](https://git-scm.com/downloads)
- Linting with [ESLint](https://eslint.org)
- Formatting with [Prettier](https://prettier.io)

## Requirements

- [Node](https://nodejs.org/en/download/)
- [Git](https://git-scm.com/downloads)

In order to deploy contract you will need:

1. **Ensure you have the following prerequisites:**

   - $ETH on Shape Mainnet or Shape Testnet.
   - Shape Mainnet or Shape Testnet RPC endpoint.

2. **Create a `.env` file in the smartContract folder with the following content:**

   ```env
   KEY="Alchemy RPC"
   PK="Deployer private key"
   ```

3. **Create a `.env` file in the website folder (/client/website) with the following content:**
   ```env
   NEXT_PUBLIC_CHAIN_ID=360
   NEXT_PUBLIC_PROJECT_ID="Rewon project Id"
   NEXT_PUBLIC_ALCHEMY_API_KEY="Alchemy api key"
   ```

## Quick start

1. **Clone the repository and install all dependencies**

   ```bash
   git clone https://github.com/hsjo12/latch.git
   cd smartContract

   npm install

   ```

2. **Deploy smart contracts**

   **On Mainnet**

   ```bash
   npx hardhat ignition deploy ignition/modules/deploy.js --network shape
   ```

   **On Testnet**

   ```bash
   npx hardhat ignition deploy ignition/modules/deploy.js --network shape_sepolia
   ```

   **On Local**

   ```bash
   npx hardhat node
   ```

   ```bash
   npx hardhat ignition deploy ignition/modules/deploy.js --network localhost
   ```

3. **Go to website folder and install all dependencies**

   ```bash
   cd ..
   cd client
   cd website

   npm install

   ```

4. **Build Latch website**

   ```bash
   npm run build
   ```

5. **Start Latch website**

   ```bash
   npm run build
   ```

## Quick visit Latch website

[Latch](https://latch.netlify.app/)

## Play Contracts

1. **Mint $Latch and Items**

   - Add address in `1.mintLatchAndItems.js`.

   ```bash
   npx hardhat run scripts/1.mintLatchAndItems.js --network <network name (eg. shape, shape_sepolia, localhost)>
   ```

2. **Import Items**

   - Add address in `2.importItems.js`.

   ```bash
   npx hardhat run scripts/2.importItems.js --network <network name (eg. shape, shape_sepolia, localhost)>
   ```

3. **Export Items**

   - Add address in `3.exportItems.js`.

   ```bash
   npx hardhat run scripts/3.exportItems.js --network <network name (eg. shape, shape_sepolia, localhost)>
   ```

## Test Contracts

```bash
npx hardhat test --network <network name (eg. shape, shape_sepolia, localhost)>
```

## Simulation Contracts

```bash
npx hardhat node (must be on mainnet)
npx hardhat run scripts/simulation/pvp.js --network localhost
```

## Deployment Addresses

#### Mainnet

| Name          | Address                                    |
| ------------- | ------------------------------------------ |
| `Latch`       | 0x1c6d87af805849F930Cee5fEd41a74e8623A44E2 |
| `TokenMarket` | 0xb955c17583D5567A82AF76c96019ee0491Fe7721 |
| `Items`       | 0x970519c725E72301f025A1d0aB9E91C547bFd91a |
| `Bridge`      | 0xe59A36716dc801e605a343bBC0d901de828A7C5a |
| `BridgeVault` | 0x4B7d08A8aa0D09B2EE8ECE7EA00a2D2c6Fde2931 |
| `Pvp`         | 0x386C282eA682e9df5B4A208fB63F2Ecc57F4c514 |
| `PvpVault`    | 0x7d63B3933e42224355fD58f9967F9D183B92B2C7 |
| `Raid`        | 0xfdd0d5efFCF2AA12921c834342F6F69bA2676230 |
| `RaidVault`   | 0x35699227a87FAF0DBA1F1EaeF5BAdC0e61007e69 |
| `TeamVault`   | 0xf491c42Ebe4B5183253E099521E54AaBdA2F1D39 |

#### Sepolia

| Name          | Address                                    |
| ------------- | ------------------------------------------ |
| `Latch`       | 0xfD80e748d4493272E67E04FeEBf95D83D5A6F249 |
| `TokenMarket` | 0xc7cdbC917E70d73A50959aD16a54DD974890cb46 |
| `Items`       | 0x47aCEcD958d5651e90d5F4DB7D6ae889BD6ca33b |
| `Bridge`      | 0x1A7cfB1b9cDF5215490A932AEe404eC5effe805e |
| `BridgeVault` | 0x216E1595C13326a2879144D9E34398be912a09d1 |
| `Pvp`         | 0x24e6638766BaA6Ec496E59A37A13B7422d8532a5 |
| `PvpVault`    | 0xFb2ed7f7C515D2b3523E141BFb834f7b9b450231 |
| `Raid`        | 0xe2E7d333aAeF8e236b3A146eAb9BA03f9aA9F232 |
| `RaidVault`   | 0xe39C7ac86cdB49688B6AE5D9511e8a2693a7923D |
| `TeamVault`   | 0x3F774146851E870458CcaeF92EB9A3638E37f681 |
