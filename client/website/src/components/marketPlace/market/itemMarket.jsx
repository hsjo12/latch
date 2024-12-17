import { useEffect, useState } from "react";
import ItemCard from "./itemCard";
import { getProvider } from "@/utils/provider/provider";
import { Contract } from "ethers";
import itemsJson from "../../../abis/items.json";
import Loading from "@/components/loading/loading";
require("dotenv").config();
export default function ItemMarket() {
  const [itemInfo, setItemInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemName = ["sword#0", "shield#1", "boots#2"];
  const idList = [0, 1, 2];
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const provider = await getProvider(process.env.NEXT_PUBLIC_CHAIN_ID);
        const latch = new Contract(itemsJson.address, itemsJson.abi, provider);
        const fetchedList = await latch.getItemInfoList(idList);

        const infoList = [];
        await Array.from(fetchedList).reduce(async (acc, cv) => {
          await acc;
          const item = Array.from(cv);
          const itemStat = Array.from(item[0]);
          infoList.push({
            atk: itemStat[0],
            def: itemStat[1],
            spd: itemStat[2],
            dur: itemStat[4],
            price: item[1],
          });
        }, Promise.resolve());
        setItemInfo(infoList);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="marketBox w-full mx-auto ">
      <div className="w-full flex flex-col justify-center items-start ">
        <h1 className="w-full subTitle2 marketBoxHead">Market</h1>
      </div>
      {loading ? (
        <div className="w-full flex flex-col justify-center items-center min-h-[500px]">
          <Loading />
        </div>
      ) : (
        <div className="w-full grid grid-cols-2 md:grid-cols-4 justify-center p-4 gap-5 max-h-[700px] overflow-y-scroll customizedScrollbar">
          {itemInfo.map((v, i) => {
            return (
              <ItemCard
                key={i}
                id={idList[i]}
                imgSrc={`/images/items/${i}.png`}
                name={itemName[i]}
                atk={v.atk}
                def={v.def}
                spd={v.spd}
                price={v.price}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
