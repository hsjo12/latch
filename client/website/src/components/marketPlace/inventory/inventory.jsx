import { useContext, useEffect, useState } from "react";
import None from "../none";
import InventoryCard from "./inventoryCard";
import { useAppKitAccount } from "@reown/appkit/react";
import { getProvider } from "@/utils/provider/provider";

import { Contract } from "ethers";
import { fetchAllTheUserImportedItems } from "@/utils/utils";
import itemsJson from "../../../abis/items.json";
import bridgeJson from "../../../abis/bridge.json";
import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
require("dotenv").config();

export default function Inventory() {
  const { update } = useContext(ContextAPI);
  const { address, isConnected } = useAppKitAccount();
  const idList = [0, 1, 2];
  const itemName = ["sword#0", "shield#1", "boots#2"];
  const [itemBalanceList, setItemBalanceList] = useState([]);

  useEffect(() => {
    if (!isConnected) return;
    (async () => {
      const provider = await getProvider(process.env.NEXT_PUBLIC_CHAIN_ID);
      const item = new Contract(itemsJson.address, itemsJson.abi, provider);
      const bridge = new Contract(bridgeJson.address, bridgeJson.abi, provider);
      const itemBalance = [];

      const importedItem = await fetchAllTheUserImportedItems(
        bridge,
        address,
        item.target
      );

      await Promise.all(
        idList.map(async (v) => {
          const isImported = await bridge.isItemImported(
            address,
            item.target,
            v
          );
          const balance = await item.balanceOf(address, v);
          if (BigInt(balance) !== 0n) {
            itemBalance.push({ id: v, balance, isImported });
          }
        })
      );
      itemBalance.sort((a, b) => a.id - b.id);
      setItemBalanceList([...itemBalance, ...importedItem]);
    })();
  }, [isConnected, address, update]);

  return (
    <div className="marketBox w-full mx-auto ">
      <div className="w-full flex flex-col justify-center items-start ">
        <h1 className="w-full subTitle2 marketBoxHead">Inventory</h1>
      </div>

      {isConnected ? (
        itemBalanceList.length > 0 ? (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 justify-center p-4 gap-5 max-h-[700px] overflow-y-scroll customizedScrollbar">
            {itemBalanceList.map((v, i) => (
              <InventoryCard
                key={i}
                id={v.id}
                imgSrc={`/images/items/${v.id}.png`}
                name={itemName[v.id]}
                isImported={v.isImported}
              />
            ))}
          </div>
        ) : (
          <div className="w-full min-h-[400px] flex flex-col justify-center items-center">
            <None />
          </div>
        )
      ) : (
        <div className="w-full min-h-[400px] flex flex-col justify-center items-center">
          <None />
        </div>
      )}
    </div>
  );
}
