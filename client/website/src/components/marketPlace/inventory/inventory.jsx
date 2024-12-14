import InventoryCard from "./inventoryCard";

export default function Inventory() {
  return (
    <div className="marketBox w-full mx-auto ">
      <div className="w-full flex flex-col justify-center items-start ">
        <h1 className="w-full subTitle2 marketBoxHead">Inventory</h1>
      </div>
      <div className="w-full grid grid-cols-2 md:grid-cols-4 justify-center p-4 gap-5 max-h-[500px] overflow-y-scroll customizedScrollbar">
        <InventoryCard
          imgSrc={"/images/items/0.png"}
          name={"Sword#0"}
          isImported={true}
        />
        <InventoryCard
          imgSrc={"/images/items/1.png"}
          name={"Shield#1"}
          isImported={false}
        />
      </div>
    </div>
  );
}
