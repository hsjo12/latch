import { ethers } from "ethers";
import { FaAnglesDown } from "react-icons/fa6";
import { useContext, useCallback, useState } from "react";
export default function TokenSwap() {
  const [inputValueInETH, setInputValueInETH] = useState("");
  const [inputValueInLATCH, setInputValueInLATCH] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");

  const handleChangeForETH = useCallback(async (e) => {
    let value = e.target.value;
    if (value == null || value === "") {
      setInputValueInLATCH("");
      setInputValueInETH("");
      return setTokenAmount(0);
    } else {
      const inputAmount = ethers.parseEther(value);
      setInputValueInETH(value);
      setInputValueInLATCH(getTokensFromETH(inputAmount).formattedAmount);
      setTokenAmount(inputAmount);
    }
  }, []);

  const handleChangeForLatch = useCallback(async (e) => {
    let value = e.target.value;
    if (value == null || value === "") {
      setInputValueInLATCH("");
      setInputValueInETH("");
      return setTokenAmount(0);
    } else {
      const inputAmount = ethers.parseEther(value);
      setInputValueInLATCH(value);
      setTokenAmount(inputAmount);
      setInputValueInETH(getETHFromTokens(inputAmount).formattedAmount);
    }
  }, []);

  const getETHFromTokens = (tokenAmount) => {
    const pricePerToken = ethers.parseEther("0.0001");
    const requiredVAlue =
      (pricePerToken * tokenAmount) / ethers.parseEther("1");
    return {
      amount: requiredVAlue,
      formattedAmount: String(parseFloat(ethers.formatEther(requiredVAlue))),
    };
  };

  const getTokensFromETH = (ethAmount) => {
    const pricePerToken = ethers.parseEther("0.0001");
    console.log(ethAmount);
    console.log(pricePerToken);
    const tokenAmount = ethAmount / pricePerToken;
    return {
      amount: String(ethers.parseEther(String(tokenAmount))),
      formattedAmount: parseFloat(tokenAmount),
    };
  };

  return (
    <div className="marketBox w-full h-full flex flex-col">
      <div className="w-full flex flex-col justify-center items-start ">
        <h1 className="w-full subTitle2 marketBoxHead">Swap</h1>
      </div>
      <div className="w-[85%] gap-3 flex flex-col justify-center items-center mx-auto h-full  pt-3 pb-3">
        <div className="w-full">
          <div className="w-full flex rounded-xl gap-3 bg-[#3b3a3ae5]">
            <input
              type="number"
              min="0"
              value={inputValueInETH}
              onChange={handleChangeForETH}
              placeholder="0"
              className="swapInput"
            />
            <p className="pr-2">ETH</p>
          </div>
        </div>
        <div className="w-full flex flex-col justify-center items-center">
          <FaAnglesDown />
        </div>
        <div className="w-full flex rounded-xl gap-3 bg-[#3b3a3ae5]">
          <input
            type="number"
            min="0"
            value={inputValueInLATCH}
            onChange={handleChangeForLatch}
            placeholder="0"
            className="swapInput"
          />
          <p className="pr-2">LATCH</p>
        </div>

        <button className="w-full btn">Swap</button>
      </div>
    </div>
  );
}
