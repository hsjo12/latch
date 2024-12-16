import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
import Link from "next/link";
import { useContext } from "react";

export default function Hero() {
  const { sectionRefs } = useContext(ContextAPI);
  return (
    <section
      ref={(el) => (sectionRefs.current.home = el)}
      className="relative h-screen"
    >
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <video
          className="w-full h-full object-cover"
          preload="auto"
          autoPlay
          loop
          muted
        >
          <source src="/images/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div>
      </div>

      <div className="relative flex flex-col justify-center items-center h-full gap-3 z-10 showingUp">
        <h1 className="heroText">LATCH</h1>
        <div className="flex flex-col md:flex-row justify-center items-center mt-4 gap-5 md:mt-8  md:gap-7 ">
          <Link href="/marketplace">
            <button className="btn w-40 md:w-32">Buy</button>
          </Link>
          <Link href="/game">
            <button className="btn w-40 md:w-32">Play</button>
          </Link>
        </div>
      </div>
    </section>
  );
}
