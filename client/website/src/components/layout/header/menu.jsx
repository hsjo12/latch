import Link from "next/link";
import { IoMdClose } from "react-icons/io";
import { usePathname } from "next/navigation";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
export default function Menu({ setMenuOn, currentPosition, scrollToSection }) {
  const pathname = usePathname();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  return (
    <div className="fixed top-0 right-0 w-screen h-screen z-30 bg-[#0000008a] ">
      <div className="absolute top-0 right-0 w-[30vh] h-screen flex flex-col items-center justify-center bg-[#141414] toLeft">
        <button
          className="absolute top-3 right-6 w-full flex justify-end items-center logo"
          onClick={() => setMenuOn(false)}
        >
          <IoMdClose />
        </button>
        <div className="flex flex-col justify-center items-center gap-3 font-bebas_neue">
          {["home", "about", "guide", "roadmap"].map((section, i) =>
            pathname === "/" ? (
              <button
                key={i}
                className={`textBtn ${
                  currentPosition === section ? "text-highlight-color" : ""
                }`}
                onClick={() => {
                  scrollToSection(section);
                  return setMenuOn(false);
                }}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ) : (
              <>
                <Link href="/">
                  <button
                    className={`textBtn ${
                      currentPosition === section ? "text-highlight-color" : ""
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                </Link>
              </>
            )
          )}

          <Link href="/marketplace">
            <button className="textBtn">Marketplace</button>
          </Link>
          <Link href="/game">
            <button className="textBtn">Game</button>
          </Link>
          {isConnected ? (
            <button className="appBtn" onClick={() => open()}>
              {`${address && address.slice(0, 6)}...${
                address && address.slice(-4)
              }`}
            </button>
          ) : (
            <button className="appBtn" onClick={() => open()}>
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
