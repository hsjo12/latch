"use client";
import { useEffect, useState } from "react";
import Footer from "./footer";
import Header from "./header/header";

export default function Layout({ children }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return;

  return (
    <div className="w-screen relative flex flex-col items-start justify-center">
      <Header />
      <div className="mb-5 w-full min-h-screen">{children}</div>
      <Footer />
    </div>
  );
}
