import { useCallback, useContext, useEffect, useState } from "react";
import { ContextAPI } from "../../../utils/contextAPI/latchContextAPI";
import { IoMdMenu } from "react-icons/io";
import Link from "next/link";
import Menu from "./menu";

export default function Header() {
  const {
    isDesktop,
    isNavOn,
    setIsNavOn,
    setCurrentPosition,
    currentPosition,
    sectionRefs,
    setAnimationOnBySection,
  } = useContext(ContextAPI);
  const [open, setOpen] = useState(false);
  const scrollToSection = (section) => {
    if (sectionRefs.current[section]) {
      setCurrentPosition(section);
      sectionRefs.current[section].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleScroll = useCallback(() => {
    const sectionPositions = Object.keys(sectionRefs.current).map((section) => {
      return {
        section,
        offsetTop: sectionRefs.current[section].offsetTop,
        offsetBottom:
          sectionRefs.current[section].offsetTop +
          sectionRefs.current[section].offsetHeight,
      };
    });

    const viewPort = window.scrollY + window.innerHeight / 2 + 100;

    let newSection = null;

    for (let i = sectionPositions.length - 1; i >= 0; i--) {
      if (
        viewPort >= sectionPositions[i].offsetTop &&
        viewPort < sectionPositions[i].offsetBottom
      ) {
        newSection = sectionPositions[i].section;
        break;
      }
    }

    if (newSection && newSection !== currentPosition) {
      setCurrentPosition(newSection);

      // Reset animation for the previous section
      if (currentPosition && currentPosition !== newSection) {
        setAnimationOnBySection((prev) => ({
          ...prev,
          [currentPosition]: false,
        }));
      }

      // Set animation for the new section
      setAnimationOnBySection((prev) => ({
        ...prev,
        [newSection]: true,
      }));
    }

    setIsNavOn(window.scrollY > 100);
  }, [
    currentPosition,
    sectionRefs,
    setAnimationOnBySection,
    setCurrentPosition,
    setIsNavOn,
  ]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isDesktop) {
    return (
      <nav
        className={`w-full fixed top-0 left-0 flex z-50 pt-1 pb-1 ${
          isNavOn ? "bg-[#000000]" : ""
        }`}
      >
        <div className="w-[95vw] mx-auto flex items-center justify-between">
          <h1 className="logo textBtn">
            <Link href="/">Latch</Link>
          </h1>

          <div className="font-bebas_neue flex gap-2 justify-center items-center menuText">
            <button className="textBtn" onClick={() => scrollToSection("home")}>
              Home
            </button>
            <button
              className="textBtn"
              onClick={() => scrollToSection("about")}
            >
              About
            </button>
            <button
              className="textBtn"
              onClick={() => scrollToSection("guide")}
            >
              Guide
            </button>
            <button
              className="textBtn"
              onClick={() => scrollToSection("roadmap")}
            >
              Roadmap
            </button>
            <button className="textBtn">Buy</button>
            <button className="textBtn">play</button>
            <button className="appBtn">Connect</button>
          </div>
        </div>
      </nav>
    );
  } else {
    return (
      <nav
        className={`w-full fixed top-0 left-0 flex z-50 pt-1 pb-1 ${
          isNavOn ? "bg-[#303030]" : ""
        }`}
      >
        {" "}
        {open && (
          <Menu
            setOpen={setOpen}
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
            onClick={() => setOpen(true)}
          >
            <IoMdMenu />
          </button>
        </div>
      </nav>
    );
  }
}
