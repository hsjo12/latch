"use client";

import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
import { useContext } from "react";
import TokenSale from "./tokenSale/tokenSale";
import ItemMarket from "./market/itemMarket";
import Inventory from "./inventory/inventory";

export default function Structure() {
  const { headerHeight } = useContext(ContextAPI);
  console.log("headerHeight", headerHeight);
  return (
    <main
      className="w-[96%] mx-auto flex flex-col justify-center items-center gap-10"
      style={{ marginTop: `${headerHeight + 50}px` }}
    >
      <h1 className="subTitle font-bebas_neue border-b-2 border-[#315499] !font-normal">
        MARKET PLACE
      </h1>
      <TokenSale />
      <ItemMarket />
      <Inventory />
    </main>
  );
}
