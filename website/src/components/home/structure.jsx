"use client";
import About from "./about";
import Guide from "./guide";
import Hero from "./hero";
import Roadmap from "./roadmap/roadmap";

export default function Structure() {
  return (
    <main>
      <Hero />
      <div className="w-full flex flex-col items-center gap-10 mt-10">
        <About />
        <Guide />
        <Roadmap />
      </div>
    </main>
  );
}
