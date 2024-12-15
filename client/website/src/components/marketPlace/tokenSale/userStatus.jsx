import { useAppKitAccount } from "@reown/appkit/react";
import None from "../none";
import { useContext, useEffect, useState } from "react";
import { getProvider } from "@/utils/provider/provider";
import { Contract, ethers } from "ethers";
import latchJson from "../../../abis/latch.json";
import { convertUnit } from "@/utils/utils";
import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
require("dotenv").config();
export default function UserStatus() {
  const { update } = useContext(ContextAPI);
  const { address, isConnected } = useAppKitAccount();
  const [userBalance, setUserBalance] = useState({
    eth: 0,
    formattedEth: 0,
    latch: 0,
    formattedLatch: 0,
  });

  useEffect(() => {
    if (!isConnected) return;

    (async () => {
      try {
        const provider = await getProvider(process.env.NEXT_PUBLIC_CHAIN_ID);
        const ethBalance = await provider.getBalance(address);
        const latch = new Contract(latchJson.address, latchJson.abi, provider);
        const latchBalance = await latch.balanceOf(address);

        setUserBalance({
          eth: ethBalance,
          formattedEth: ethers.formatEther(ethBalance),
          latch: latchBalance,
          formattedLatch: ethers.formatEther(latchBalance),
        });
      } catch (error) {
        console.log(error);
      }
    })();
  }, [isConnected, address, update]);

  return (
    <div className="marketBox w-full h-full flex flex-col">
      <div className="w-full flex flex-col justify-center items-start ">
        <h1 className="w-full subTitle2 marketBoxHead">User Status</h1>
      </div>
      {isConnected ? (
        <div className="w-full flex flex-col justify-center pt-1">
          <div className="marketBoxContents">
            <p className="text-center">User</p>
            <p className="text-center">
              {`${address && address.slice(0, 6)}...${
                address && address.slice(-4)
              }`}
            </p>
          </div>
          <div className="marketBoxContents">
            <p className="text-center">ETH BALANCE</p>
            <p className="text-center">
              {convertUnit(userBalance.formattedEth)} ETH
            </p>
          </div>
          <div className="marketBoxContents">
            <p className="text-center">LATCH BALANCE</p>
            <p className="text-center">
              {convertUnit(userBalance.formattedLatch)} ETH
            </p>
          </div>
          <div className="bg-[#1f378198] h-full flex flex-col justify-center items-center rounded-b-lg">
            <p>WELCOME TO LATCH</p>
            <p>LET'S PLAY LATCH</p>
          </div>
        </div>
      ) : (
        <None />
      )}
    </div>
  );
}
