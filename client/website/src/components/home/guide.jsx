import { ContextAPI } from "@/utils/contextAPI/latchContextAPI";
import Link from "next/link";
import { useContext } from "react";

export default function Guide() {
  const { sectionRefs, animationOnBySection } = useContext(ContextAPI);

  const steps = [
    {
      title: "Step 1: Buy $Lat and Items",
      description:
        "Before entering the game, consider purchasing $Lat tokens. These tokens are used for minting NFT items and participating in battles. Items play a crucial role in determining the outcome of battles, as each item comes with unique stats that enhance your character's abilities.",
      linkName: "Buy $Lat and Items",
      link: "/",
      animation: "toLeft",
    },
    {
      title: "Step 2: Bridge Your Items",
      description:
        "To use your items in Latch, you need to transfer them to the Latch bridge contract. This step ensures your items are ready for use in the game world.",
      linkName: "Transfer Items",
      link: "/",
      animation: "toRight",
    },
    {
      title: "Step 3: Enter the Latch World",
      description:
        "Even if you skip Steps 1 and 2, you can still enter the Latch world and participate in battles. However, having items and $Lat tokens may give you an advantage.",
      linkName: "Enter",
      link: "/",
      animation: "toLeft",
    },
    {
      title: "Step 4: toRight",
      description:
        "To challenge an opponent, head to the Battle Zone in the game. You'll need to stake $Lat tokens to join the fight. In battles, you have full control of your character's movements, attacks, and strategies. Skillful control can outweigh item stats, making quick reflexes and smart decisions key to victory.",
      linkName: undefined,
      link: "/",
      animation: "toRight",
    },
  ];

  return (
    <section
      ref={(el) => (sectionRefs.current.guide = el)}
      className={`w-full bg-[#2f2f2f9e] pb-9 pt-9 ${
        animationOnBySection?.guide ? "" : "invisible"
      }`}
    >
      <div className="w-[95%] mx-auto flex flex-col justify-center items-center gap-10">
        <h1
          className={`w-full subTitle text-center ${
            animationOnBySection?.guide ? "popUp" : ""
          }`}
        >
          GUIDE
        </h1>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`w-full flex flex-col gap-5 guideBox justify-around ${
                animationOnBySection?.guide ? step.animation : ""
              }`}
            >
              <h1 className="w-full text-center subTitle2">{step.title}</h1>
              <p>{step.description}</p>
              {step.linkName && (
                <Link
                  href={step.link}
                  className="linkBtn text-center z-10 w-full md:w-[70%] mx-auto"
                >
                  {step.linkName}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
