import { useContext, useEffect, useState } from "react";
import None from "../none";
import InventoryCard from "./inventoryCard";
import { useAppKitAccount } from "@reown/appkit/react";
import { getProvider } from "@/utils/provider/provider";
import { Contract } from "ethers";
import {
  fetchAllTheUserImportedItems,
  fetchAllTheUserImportedItemAddresses,
} from "@/utils/utils";

import bridgeJson from "../../../abis/bridge.json";
import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
import Loading from "@/components/loading/loading";
import { fetchMetadata, fetchNFTs } from "@/utils/alchemy/nftFetch";

export default function Inventory() {
  const {
    unImportedItemList,
    setUnImportedItemList,
    importedItemList,
    setImportedItemList,
  } = useContext(ContextAPI);
  const { address, isConnected } = useAppKitAccount();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) return;

    const loadInventory = async () => {
      try {
        setLoading(true);
        const provider = await getProvider(process.env.NEXT_PUBLIC_CHAIN_ID);
        const bridge = new Contract(
          bridgeJson.address,
          bridgeJson.abi,
          provider
        );

        // Fetch unimported NFTs
        const notImportedNfts = await fetchNFTs(address);
        setUnImportedItemList(notImportedNfts);

        // Fetch imported NFT addresses
        const importedItemAddresses =
          await fetchAllTheUserImportedItemAddresses(bridge, address);
        const importedNfts = {};

        // Fetch imported NFT IDs
        await Promise.all(
          importedItemAddresses.map(async (itemAddress) => {
            const ids = await fetchAllTheUserImportedItems(
              bridge,
              address,
              itemAddress
            );
            importedNfts[itemAddress] = ids;
          })
        );

        // Fetch metadata for imported NFTs
        const importedItems = await Promise.all(
          Object.entries(importedNfts).flatMap(([itemAddress, ids]) =>
            ids.map((id) => fetchMetadata(itemAddress, id))
          )
        );

        setImportedItemList(importedItems.filter(Boolean));
      } catch (error) {
        console.error("Error loading inventory:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, [isConnected, address]);

  return (
    <div className="marketBox w-full mx-auto">
      <div className="w-full flex flex-col justify-center items-start">
        <h1 className="w-full subTitle2 marketBoxHead">Inventory</h1>
      </div>

      {isConnected ? (
        loading ? (
          <div className="w-full flex flex-col justify-center items-center min-h-[300px]">
            <Loading />
          </div>
        ) : unImportedItemList.length > 0 || importedItemList.length > 0 ? (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-5 p-4 max-h-[700px] overflow-y-scroll customizedScrollbar">
            {/* Unimported Items */}

            {unImportedItemList.map((item, index) => (
              <InventoryCard
                key={`${item.itemAddress}_${item.tokenId}_${index}`}
                itemAddress={item.itemAddress}
                tokenId={item.tokenId}
                imgSrc={item.imgSrc}
                name={item.tokenName}
                isImported={false}
              />
            ))}

            {/* Imported Items */}

            {importedItemList.map((item, index) => (
              <InventoryCard
                key={`${item.itemAddress}_${item.tokenId}_${index}`}
                itemAddress={item.itemAddress}
                tokenId={item.tokenId}
                imgSrc={item.imgSrc}
                name={item.tokenName}
                isImported={true}
              />
            ))}
          </div>
        ) : (
          <div className="w-full min-h-[300px] flex flex-col justify-center items-center">
            <None />
          </div>
        )
      ) : (
        <div className="w-full min-h-[300px] flex flex-col justify-center items-center">
          <None />
        </div>
      )}
    </div>
  );
}
