function convertUnit(number, dec = 3) {
  number = Number(number);
  return parseFloat(number.toFixed(dec).toLocaleString());
}

const imageUrlConverter = (url) => {
  if (url == null || url == "") return "/images/notfound/notFound.png";
  url = String(url);

  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  } else {
    return url;
  }
};

const fetchData = async (url) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data); // JSON 데이터를 콘솔에 출력
    return data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
};

const fetchPaginatedItems = async (
  contract,
  owner,
  target,
  startIndex,
  count
) => {
  const total = await contract.totalImportedUserItem(owner, target);
  if (startIndex >= total) throw new Error("Start index out of range");

  const items = await contract.importedUserItemList(
    owner,
    target,
    startIndex,
    count
  );

  return items.map((v) => v);
};

const fetchAllTheUserImportedItems = async (contract, owner, target) => {
  const pageSize = 30;
  const total = await contract.totalImportedUserItem(owner, target);
  const pages = Math.ceil(Number(total) / pageSize);

  const allItems = [];
  for (let page = 0; page < pages; page++) {
    const startIndex = page * pageSize;
    const items = await fetchPaginatedItems(
      contract,
      owner,
      target,
      startIndex,
      pageSize
    );
    allItems.push(...items);
  }

  return allItems;
};

const fetchPaginatedItemAddresses = async (
  contract,
  owner,
  startIndex,
  count
) => {
  const total = await contract.totalImportedUserItemAddress(owner);
  if (startIndex >= total) throw new Error("Start index out of range");

  const itemsAddress = await contract.importedUserItemAddress(
    owner,
    startIndex,
    count
  );

  return itemsAddress.map((v) => v);
};

const fetchAllTheUserImportedItemAddresses = async (contract, owner) => {
  const pageSize = 30;
  const total = await contract.totalImportedUserItemAddress(owner);
  const pages = Math.ceil(Number(total) / pageSize);

  const allItems = [];
  for (let page = 0; page < pages; page++) {
    const startIndex = page * pageSize;
    const items = await fetchPaginatedItemAddresses(
      contract,
      owner,
      startIndex,
      pageSize
    );
    allItems.push(...items);
  }

  return allItems;
};

module.exports = {
  convertUnit,
  imageUrlConverter,
  fetchData,
  fetchAllTheUserImportedItems,
  fetchAllTheUserImportedItemAddresses,
};
