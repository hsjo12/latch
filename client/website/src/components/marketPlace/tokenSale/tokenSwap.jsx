import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { FaArrowsRotate } from "react-icons/fa6";
import { useState, useCallback, useContext } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import {
  toastMessage,
  txApprove,
  txMessage,
} from "@/utils/toastify/toastMessageStyle";
import tokenMarketJson from "../../../abis/tokenMarket.json";
import latchJson from "../../../abis/latch.json";
import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
export default function TokenSwap() {
  const { setLoadingScreenOn, setUpdate } = useContext(ContextAPI);
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const [inputValue, setInputValue] = useState({
    eth: "",
    formattedEth: "",
    latch: "",
    formattedLatch: "",
  });
  const [reversal, setReversal] = useState(false);

  const initializeInputValue = () => {
    setInputValue({ eth: "", formattedEth: "", latch: "", formattedLatch: "" });
  };

  const handleInputChange = useCallback((e, type) => {
    const value = e.target.value;
    if (!value) {
      setInputValue({
        eth: "",
        formattedEth: "",
        latch: "",
        formattedLatch: "",
      });
      return;
    }

    const inputAmount = ethers.parseEther(value);
    if (type === "ETH") {
      const tokens = getTokensFromETH(inputAmount);
      setInputValue({
        eth: ethers.parseEther(value),
        formattedEth: value,
        latch: tokens.amount,
        formattedLatch: tokens.formattedAmount,
      });
    } else {
      const eth = getETHFromTokens(inputAmount);
      setInputValue({
        eth: eth.amount,
        formattedEth: eth.formattedAmount,
        latch: ethers.parseEther(value),
        formattedLatch: value,
      });
    }
  }, []);

  const getETHFromTokens = (tokenAmount) => {
    const pricePerToken = ethers.parseEther("0.00000001");
    const requiredValue =
      (pricePerToken * tokenAmount) / ethers.parseEther("1");
    return {
      amount: ethers.formatEther(requiredValue),
      formattedAmount: parseFloat(ethers.formatEther(requiredValue)).toFixed(9),
    };
  };

  const getTokensFromETH = (ethAmount) => {
    const pricePerToken = ethers.parseEther("0.00000001");
    const tokenAmount = ethAmount / pricePerToken;

    return {
      amount: ethers.parseEther(String(tokenAmount)),
      formattedAmount: parseFloat(tokenAmount).toFixed(9),
    };
  };

  const renderInputField = (type) => (
    <div className="w-full flex rounded-xl gap-3 bg-[#3b3a3ae5]">
      <input
        type="number"
        min="0"
        value={
          type === "ETH"
            ? Number(inputValue.formattedEth).toString()
            : Number(inputValue.formattedLatch).toString()
        }
        onChange={(e) => handleInputChange(e, type)}
        placeholder="0"
        className="swapInput"
      />
      <p className="pr-2">{type}</p>
    </div>
  );

  const swap = useCallback(
    async (type) => {
      if (!isConnected) return toastMessage("Please connect", "warn");
      setLoadingScreenOn(true);
      const ethersProvider = new BrowserProvider(walletProvider);
      const signer = await ethersProvider.getSigner();
      const tokenMarket = new Contract(
        tokenMarketJson.address,
        tokenMarketJson.abi,
        signer
      );
      if (type === "ETH") {
        try {
          if ((await ethersProvider.getBalance(address)) < inputValue.eth) {
            setLoadingScreenOn(false);
            return toastMessage("Insufficient $latch", "warn");
          }

          const tx = await tokenMarket.buyToken(inputValue.latch, {
            value: inputValue.eth,
          });
          await txMessage(tx);
          setUpdate(new Date().getTime());
        } catch (error) {
          console.log(error);
          setLoadingScreenOn(false);
        }
      } else {
        try {
          const latch = new Contract(latchJson.address, latchJson.abi, signer);

          if ((await latch.balanceOf(address)) < inputValue.latch) {
            setLoadingScreenOn(false);
            return toastMessage("Insufficient $latch", "warn");
          }

          if (
            (await latch.allowance(address, tokenMarket.target)) <
            inputValue.latch
          ) {
            toastMessage("Please approve", "warn");
            const tx = await latch.approve(
              tokenMarket.target,
              inputValue.latch
            );
            await txApprove(tx);
          }
          const tx = await tokenMarket.sellToken(inputValue.latch);
          await txMessage(tx);
          setUpdate(new Date().getTime());
        } catch (error) {
          console.log(error);
          setLoadingScreenOn(false);
        }
      }

      initializeInputValue();
      setLoadingScreenOn(false);
    },
    [isConnected, inputValue, address]
  );

  return (
    <div className="marketBox w-full h-full flex flex-col">
      <div className="w-full flex flex-col justify-center items-start">
        <h1 className="w-full subTitle2 marketBoxHead">Swap</h1>
        <div className="w-[85%] gap-3 flex flex-col justify-center items-center mx-auto h-full pt-3 pb-3">
          {reversal ? renderInputField("LATCH") : renderInputField("ETH")}
          <div className="w-full flex flex-col justify-center items-center">
            <button onClick={() => setReversal((prev) => !prev)}>
              <FaArrowsRotate className="swapArrowBtn" />
            </button>
          </div>
          {reversal ? renderInputField("ETH") : renderInputField("LATCH")}
          <button
            className="w-full btn"
            onClick={reversal ? () => swap("LATCH") : () => swap("ETH")}
          >
            Swap
          </button>
        </div>
      </div>
    </div>
  );
}
