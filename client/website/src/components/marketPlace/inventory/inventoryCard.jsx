import Image from "next/image";

export default function InventoryCard({ imgSrc, name, isImported }) {
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
      {isImported ? (
        <button className="w-[90%] exportBtn mx-auto">Export</button>
      ) : (
        <button className="w-[90%] importBtn mx-auto ">Import</button>
      )}
    </div>
  );
}
