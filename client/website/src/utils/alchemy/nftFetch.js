import { Alchemy, Network } from "alchemy-sdk";
require("dotenv").config();
// Alchemy Configuration
const config = {
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.SHAPE_MAINNET,
};

const alchemy = new Alchemy(config);

// Utility function for fetching data from a URL
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return null;
  }
};

// Fetch NFTs owned by a specific address
export const fetchNFTs = async (address) => {
  try {
    const results = await alchemy.nft.getNftsForOwner(address);

    const nfts = [];

    for (const nft of results.ownedNfts) {
      const {
        contract: { address: contractAddress },
        tokenId,
        tokenUri,
        name,
        image,
      } = nft;

      const tokenData = tokenUri ? await fetchData(tokenUri) : null;
      const imageUrl = tokenData?.image || image?.originalUrl || "";

      nfts.push({
        itemAddress: contractAddress,
        tokenId,
        imgSrc: imageUrl || "/images/notfound/notFound.png",
        tokenName: name || "Unnamed",
      });
    }

    return nfts;
  } catch (error) {
    console.error("Error fetching NFTs:", error.message);
    return [];
  }
};

// Fetch metadata for a specific NFT
export const fetchMetadata = async (itemAddress, tokenId) => {
  try {
    const result = await alchemy.nft.getNftMetadata(itemAddress, tokenId);
    const { tokenUri, name, image } = result;
    const tokenData = tokenUri ? await fetchData(tokenUri) : null;

    return {
      itemAddress,
      tokenId,
      imgSrc:
        tokenData?.image ||
        image?.originalUrl ||
        "/images/notfound/notFound.png",
      tokenName: name || "Unnamed",
    };
  } catch (error) {
    console.error("Error fetching metadata:", error.message);
    return null;
  }
};
