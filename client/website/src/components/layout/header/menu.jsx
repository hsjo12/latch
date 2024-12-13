import Link from "next/link";
import { FaXTwitter } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

export default function Menu({ setOpen, currentPosition, scrollToSection }) {
  return (
    <div className="fixed top-0 right-0 w-screen h-screen z-30 bg-[#0000008a] ">
      <div className="absolute top-0 right-0 w-[30vh] h-screen flex flex-col items-center justify-center bg-[#141414] toLeft">
        <button
          className="absolute top-3 right-6 w-full flex justify-end items-center logo"
          onClick={() => setOpen(false)}
        >
          <IoMdClose />
        </button>
        <div className="flex flex-col justify-center items-center gap-3 font-bebas_neue">
          {["home", "about", "guide", "roadmap"].map((section) => (
            <button
              key={section}
              className={`textBtn ${
                currentPosition === section ? "text-highlight-color" : ""
              }`}
              onClick={() => {
                scrollToSection(section);
                return setOpen(false);
              }}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}

          <Link href="/marketplace">
            <button className="textBtn">Marketplace</button>
          </Link>
          <button className="textBtn">play</button>
          <button className="appBtn">Connect</button>
        </div>
      </div>
    </div>
  );
}
