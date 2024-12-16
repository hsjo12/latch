import { useCallback, useContext, useEffect, useState } from "react";
import { ContextAPI } from "../../../utils/contextAPI/latchContextAPI";
import { IoMdMenu } from "react-icons/io";
import Link from "next/link";
import Menu from "./menu";
import { usePathname } from "next/navigation";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
export default function Header() {
  const {
    isDesktop,
    isNavOn,
    setIsNavOn,
    setCurrentPosition,
    currentPosition,
    sectionRefs,
    setAnimationOnBySection,
    headerRef,
    setHeaderHeight,
  } = useContext(ContextAPI);

  const pathname = usePathname();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [menuOn, setMenuOn] = useState(false);

  const scrollToSection = useCallback(
    (section) => {
      if (sectionRefs.current[section]) {
        setCurrentPosition(section);
        sectionRefs.current[section].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [sectionRefs, setCurrentPosition]
  );

  const handleScroll = useCallback(() => {
    setIsNavOn(window.scrollY > 100);
    if (pathname !== "/") return;

    const sectionPositions = Object.entries(sectionRefs.current).map(
      ([section, ref]) => ({
        section,
        offsetTop: ref.offsetTop,
        offsetBottom: ref.offsetTop + ref.offsetHeight,
      })
    );

    const viewPort = window.scrollY + window.innerHeight / 2 + 100;
    const newSection = sectionPositions.find(
      ({ offsetTop, offsetBottom }) =>
        viewPort >= offsetTop && viewPort < offsetBottom
    )?.section;

    if (newSection && newSection !== currentPosition) {
      console.log();
      setCurrentPosition(newSection);
      setAnimationOnBySection((prev) => ({
        ...prev,
        [newSection]: true,
      }));
    }
  }, [
    pathname,
    currentPosition,
    sectionRefs,
    setAnimationOnBySection,
    setCurrentPosition,
    setIsNavOn,
  ]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [headerRef, setHeaderHeight]);

  const renderMenuButtons = useCallback(
    () => (
      <div className="font-bebas_neue flex gap-2 justify-center items-center menuText">
        {pathname === "/"
          ? ["home", "about", "guide", "roadmap"].map((section) => (
              <button
                key={section}
                className="textBtn"
                onClick={() => scrollToSection(section)}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))
          : ["Home", "About", "Guide", "Roadmap"].map((text) => (
              <Link key={text} href="/">
                <button className="textBtn">{text}</button>
              </Link>
            ))}
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
    ),
    [pathname, scrollToSection, isConnected]
  );

  return (
    <nav
      ref={headerRef}
      className={`w-full fixed top-0 left-0 flex z-50 pt-1 pb-1 ${
        isNavOn ? (isDesktop ? "bg-[#000000]" : "bg-[#303030]") : ""
      }`}
    >
      {isDesktop ? (
        <div className="w-[95vw] mx-auto flex items-center justify-between">
          <h1 className="logo textBtn">
            <Link href="/">Latch</Link>
          </h1>
          {renderMenuButtons()}
        </div>
      ) : (
        <>
          {menuOn && (
            <Menu
              setMenuOn={setMenuOn}
              currentPosition={currentPosition}
              scrollToSection={scrollToSection}
            />
          )}
          <div className="w-[95vw] mx-auto flex items-center justify-between">
            <h1 className="logo textBtn">
              <Link href="/">Latch</Link>
            </h1>
            <button
              className="w-full flex justify-end items-center logo"
              onClick={() => setMenuOn(true)}
            >
              <IoMdMenu />
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
