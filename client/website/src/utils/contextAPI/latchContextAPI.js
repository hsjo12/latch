"use client";
import { createContext, useState, useRef } from "react";
import { useMediaQuery } from "react-responsive";

export const ContextAPI = createContext();
export function LatchContextAPI({ children }) {
  const isDesktop = useMediaQuery({
    query: "(min-width:1224px)",
  });
  const [isNavOn, setIsNavOn] = useState(false);
  const sectionRefs = useRef({});
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [currentPosition, setCurrentPosition] = useState("home");
  const [animationOnBySection, setAnimationOnBySection] = useState({});
  const [update, setUpdate] = useState(null);
  const [loadingScreenOn, setLoadingScreenOn] = useState(false);
  const [unImportedItemList, setUnImportedItemList] = useState(null);
  const [importedItemList, setImportedItemList] = useState(null);

  return (
    <ContextAPI.Provider
      value={{
        isDesktop,
        isNavOn,
        setIsNavOn,
        update,
        setUpdate,
        currentPosition,
        setCurrentPosition,
        sectionRefs,
        headerRef,
        headerHeight,
        setHeaderHeight,
        animationOnBySection,
        setAnimationOnBySection,
        loadingScreenOn,
        setLoadingScreenOn,
        unImportedItemList,
        setUnImportedItemList,
        importedItemList,
        setImportedItemList,
      }}
    >
      {children}
    </ContextAPI.Provider>
  );
}
