import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
import Image from "next/image";
import { useContext } from "react";

export default function About() {
  const { sectionRefs, isDesktop, animationOnBySection } =
    useContext(ContextAPI);

  if (isDesktop) {
    return (
      <section
        ref={(el) => (sectionRefs.current.about = el)}
        className={`w-[96%] mx-auto flex flex-col justify-center items-center ${
          animationOnBySection?.about ? "" : "invisible"
        }`}
      >
        <div className="w-full flex justify-center items-center">
          <div
            className={`w-[80%] flex flex-col justify-center items-center mediaContainer ${
              animationOnBySection?.about ? "toRight" : ""
            }`}
          >
            <Image
              priority
              src="/images/about.gif"
              alt="Image"
              className="w-full !object-contain"
              fill
              sizes="100%"
              unoptimized
              style={{ filter: "brightness(50%)" }}
            />
          </div>

          <div className={`w-full flex flex-col items-center gap-5`}>
            <h1
              className={`w-full subTitle ${
                animationOnBySection?.about ? "popUp md:showingUp" : ""
              }`}
            >
              ABOUT
            </h1>
            <p
              className={`whitespace-pre-line break-words ${
                animationOnBySection?.about ? "popUp md:toLeft" : ""
              }`}
            >
              Welcome to Latch, a blockchain-based gaming world where strategy
              and skill meet innovation. In Latch, players own and trade NFT
              items, engage in thrilling battles, and enhance characters with
              unique gear. The game’s token economy, powered by $Lat, rewards
              strategic gameplay and true asset ownership. Whether you're here
              to compete or explore, Latch offers an immersive experience for
              everyone.
            </p>
          </div>
        </div>
      </section>
    );
  } else {
    return (
      <section
        ref={(el) => (sectionRefs.current.about = el)}
        className="w-[96%] mx-auto flex flex-col justify-center items-center"
      >
        <div className="w-full flex flex-col justify-center items-center gap-5">
          <div
            className={`w-full flex flex-col justify-center items-center mediaContainer ${
              animationOnBySection?.about ? "popUp md:showingUp" : ""
            }`}
          >
            <Image
              priority
              src="/images/about.gif"
              alt="AmonBaby Image"
              className="w-full !object-contain"
              fill
              sizes="100%"
              unoptimized
              style={{ filter: "brightness(50%)" }}
            />
          </div>
          <h1
            className={`w-full subTitle text-center ${
              animationOnBySection?.about ? "toTop" : ""
            }`}
          >
            ABOUT
          </h1>
          <div
            className={`w-full flex flex-col items-center gap-5 text-center ${
              animationOnBySection?.about ? "toLeft" : ""
            }`}
          >
            Welcome to Latch, a blockchain-based gaming world where strategy and
            skill meet innovation. In Latch, players own and trade NFT items,
            engage in thrilling battles, and enhance characters with unique
            gear. The game’s token economy, powered by $Lat, rewards strategic
            gameplay and true asset ownership. Whether you're here to compete or
            explore, Latch offers an immersive experience for everyone.
          </div>
        </div>
      </section>
    );
  }
}
