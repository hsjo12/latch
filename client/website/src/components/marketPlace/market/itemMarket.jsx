import ItemCard from "./itemCard";

export default function ItemMarket() {
  return (
    <div className="marketBox w-full mx-auto ">
      <div className="w-full flex flex-col justify-center items-start ">
        <h1 className="w-full subTitle2 marketBoxHead">Market</h1>
      </div>
      <div className="w-full grid grid-cols-2 md:grid-cols-4 justify-center p-4 gap-5 max-h-[500px] overflow-y-scroll customizedScrollbar">
        <ItemCard
          imgSrc={"/images/items/0.png"}
          name={"Sword#0"}
          atk={10}
          def={0}
          spd={-2}
          price={100}
        />
        <ItemCard
          imgSrc={"/images/items/1.png"}
          name={"Shield#1"}
          atk={0}
          def={12}
          spd={-3}
          price={300}
        />
        <ItemCard
          imgSrc={"/images/items/2.png"}
          name={"boots#2"}
          atk={0}
          def={5}
          spd={5}
          price={500}
        />
      </div>
    </div>
  );
}
