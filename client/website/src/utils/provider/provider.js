import { ethers } from "ethers";
import { networkInfo } from "./data";

export const getProvider = (chainId = 360) => {
  // const rpc = networkInfo[chainId].rpc;
  return new ethers.JsonRpcProvider("https://mainnet.shape.network");
};

export const getContract = (target, abi, chainId) => {
  // const rpc = networkInfo[chainId].rpc;
  const provider = new ethers.JsonRpcProvider("https://mainnet.shape.network");
  return new ethers.Contract(target, abi, provider);
};
