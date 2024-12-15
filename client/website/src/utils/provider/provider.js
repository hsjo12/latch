import { ethers } from "ethers";
import { networkInfo } from "./data";

export const getProvider = (chainId = 360) => {
  const rpc = networkInfo[chainId].rpc;
  return new ethers.JsonRpcProvider(rpc);
};

export const getContract = (target, abi, chainId) => {
  const rpc = networkInfo[chainId].rpc;
  const provider = new ethers.JsonRpcProvider(rpc);
  return new ethers.Contract(target, abi, provider);
};
