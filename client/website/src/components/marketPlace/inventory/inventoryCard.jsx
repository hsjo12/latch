import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
import {
  toastMessage,
  txApprove,
  txMessage,
} from "@/utils/toastify/toastMessageStyle";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider, Contract } from "ethers";
import Image from "next/image";
import { useCallback, useContext } from "react";
import itemsJson from "../../../abis/items.json";
import bridgeJson from "../../../abis/bridge.json";
export default function InventoryCard({ id, imgSrc, name, isImported }) {
  const { setLoadingScreenOn, setUpdate } = useContext(ContextAPI);
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const importItem = useCallback(async () => {
    try {
      if (!isConnected) return toastMessage("Please connect", "warn");
      setLoadingScreenOn(true);
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const items = new Contract(itemsJson.address, itemsJson.abi, signer);
      const bridge = new Contract(bridgeJson.address, bridgeJson.abi, signer);

      const isApprovedForAll = await items.isApprovedForAll(
        address,
        bridge.target
      );

      if (!isApprovedForAll) {
        toastMessage("Please approve", "warn");
        const tx = await items.setApprovalForAll(bridge.target, true);
        await txApprove(tx);
      }
      const tx = await bridge.importItem(items.target, id);
      await txMessage(tx);
      setLoadingScreenOn(false);
      setUpdate(new Date().getTime());
    } catch (error) {
      console.log(error);
      setLoadingScreenOn(false);
    }
  }, [address, isConnected, id]);

  const exportItem = useCallback(async () => {
    try {
      if (!isConnected) return toastMessage("Please connect", "warn");
      setLoadingScreenOn(true);
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const items = new Contract(itemsJson.address, itemsJson.abi, signer);
      const bridge = new Contract(bridgeJson.address, bridgeJson.abi, signer);

      const isItemImported = await bridge.isItemImported(
        address,
        items.target,
        id
      );
      console.log("isItemImported", isItemImported);
      if (!isItemImported) {
        setLoadingScreenOn(false);
        return toastMessage("Not Found", "warn");
      }
      const tx = await bridge.exportItem(items.target, id);
      await txMessage(tx);
      setLoadingScreenOn(false);
      setUpdate(new Date().getTime());
    } catch (error) {
      console.log(error);
      setLoadingScreenOn(false);
    }
  }, [address, isConnected, id]);

  return (
    <div className="itemCard flex flex-col justify-around items-start p-2 font-bebas_neue gap-2">
      <div className="flex flex-col justify-center items-center mediaContainer">
        <Image
          priority
          src={imgSrc}
          alt="Image"
          className="w-full !object-contain"
          fill
          sizes="100%"
          style={{ filter: "brightness(90%)" }}
        />
      </div>

      <p className="w-full text-center">{name}</p>
      {isImported ? (
        <button className="w-[90%] exportBtn mx-auto" onClick={exportItem}>
          Export
        </button>
      ) : (
        <button className="w-[90%] importBtn mx-auto" onClick={importItem}>
          Import
        </button>
      )}
    </div>
  );
}
