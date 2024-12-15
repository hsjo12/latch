"use client";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

import { shape } from "@reown/appkit/networks";
import { defineChain } from "@reown/appkit/networks";

require("dotenv").config();

const localNode = defineChain({
  id: 31337,
  name: "localNode",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545/"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "BLOCK_EXPLORER_URL" },
  },
  contracts: {},
});

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://latch.com", // origin must match your domain & subdomain
  icons: ["https://latch.com/"],
};

export const walletModal = createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: [localNode],
  defaultNetwork: localNode,
  projectId,
  allowUnsupportedChain: false,
  enableWalletConnect: true,
  featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
  ],
  allWallets: "HIDE",
  features: {
    analytics: false, // Optional - defaults to your Cloud configuration
    onramp: false,
    swaps: false,
    email: false, // default to true
    socials: [],
  },
});

export default function Web3Modal({ children }) {
  return children;
}
