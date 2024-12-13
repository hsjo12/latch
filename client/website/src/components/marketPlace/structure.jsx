"use client";

import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
import { useContext } from "react";
import BuyTokens from "./buyTokens";

export default function Structure() {
  const { headerHeight } = useContext(ContextAPI);
  console.log("headerHeight", headerHeight);
  return (
    <main
      className="w-[96%] mx-auto flex flex-col justify-center items-center"
      style={{ marginTop: `${headerHeight}px` }}
    >
      <BuyTokens />
    </main>
  );
}
