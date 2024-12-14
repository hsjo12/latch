import Image from "next/image";

export default function ItemCard({ imgSrc, name, atk, def, spd, price }) {
  return (
    <div className="itemCard flex flex-col justify-around items-start p-2 font-bebas_neue gap-2">
      <div className="flex flex-col justify-center items-center mediaContainer">
        <Image
          priority
          src={imgSrc}
          alt="Image"
          className="w-full !object-contain"
          fill
          sizes="100%"
          optimized
          style={{ filter: "brightness(90%)" }}
        />
      </div>

      <p className="w-full text-center">{name}</p>
      <p className="w-full text-center">ATK: {atk}</p>
      <p className="w-full text-center">DEF: {def}</p>
      <p className="w-full text-center">SPD: {spd}</p>
      <p className="w-full text-center">price: {price} LATCH </p>
      <button className="w-[90%] btn mx-auto">Mint</button>
    </div>
  );
}
