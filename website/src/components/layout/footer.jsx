import { FaXTwitter } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="z-50 bg-[#000000] menuText font-bebas_neue tracking-[0.05rem] w-full flex flex-col justify-center items-center gap-2  pt-4 pb-4">
      <p>All right reserved by Latch</p>

      <div className="w-full flex justify-center items-center gap-2">
        <Link href="https://x.com" target="_blank" className="textBtn icon">
          <FaXTwitter />
        </Link>
        <Link
          href="https://telegram.org/"
          target="_blank"
          className="textBtn icon"
        >
          <FaTelegramPlane />
        </Link>
      </div>
    </footer>
  );
}
