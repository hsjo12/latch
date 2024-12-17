import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
import { convertUnit } from "@/utils/utils";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider, Contract, ethers } from "ethers";
import Image from "next/image";
import { useCallback, useContext } from "react";
import itemsJson from "../../../abis/items.json";
import latchJson from "../../../abis/latch.json";
import {
  toastMessage,
  txApprove,
  txMessage,
} from "@/utils/toastify/toastMessageStyle";
export default function ItemCard({ id, imgSrc, name, atk, def, spd, price }) {
  const { setLoadingScreenOn, setUpdate } = useContext(ContextAPI);
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const mint = useCallback(async () => {
    try {
      if (!isConnected) return toastMessage("Please connect", "warn");
      setLoadingScreenOn(true);

      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const items = new Contract(itemsJson.address, itemsJson.abi, signer);
      const latch = new Contract(latchJson.address, latchJson.abi, signer);

      if ((await latch.balanceOf(address)) < price) {
        setLoadingScreenOn(false);
        return toastMessage("Insufficient $latch", "warn");
      }

      if ((await latch.allowance(address, items.target)) < price) {
        toastMessage("Please approve", "warn");
        const tx = await latch.approve(items.target, price);
        await txApprove(tx);
      }

      const tx = await items.mintItems(id, 1);
      await txMessage(tx);
      setUpdate(new Date().getTime());
      setLoadingScreenOn(false);
    } catch (error) {
      console.log(error);
      setLoadingScreenOn(false);
    }
  }, [isConnected, address]);

  return (
    <div className="itemCard flex flex-col justify-around items-start p-2 font-bebas_neue gap-2">
      <div className="flex flex-col justify-center items-center mediaContainer">
        <Image
          priority
          src={imgSrc || "/image/notfound/notFound.png"}
          alt="Image"
          className="w-full !object-contain"
          fill
          sizes="100%"
          style={{ filter: "brightness(90%)" }}
        />
      </div>

      <p className="w-full text-center">{name}</p>
      <p className="w-full text-center">ATK: {atk}</p>
      <p className="w-full text-center">DEF: {def}</p>
      <p className="w-full text-center">SPD: {spd}</p>
      <p className="w-full text-center">
        price: {convertUnit(ethers.formatEther(String(price)))} LATCH
      </p>
      <button className="w-[90%] btn mx-auto" onClick={mint}>
        Mint
      </button>
    </div>
  );
}
