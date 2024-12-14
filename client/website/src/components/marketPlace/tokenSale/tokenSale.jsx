import TokenSwap from "./tokenSwap";
import UserStatus from "./userStatus";

export default function TokenSale() {
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-2 justify-items-center items-center gap-5">
      <TokenSwap />
      <UserStatus />
    </section>
  );
}
