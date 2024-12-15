import { useEffect, useRef, useState } from "react";

export default function RoadmapBox({ Icon, title, textList, animation }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`roadmapBox flex flex-col justify-start items-start break-all h-full min-h-[150px] ${
        isVisible ? `${animation}` : ""
      }`}
    >
      <div className="w-full flex justify-start items-center gap-3">
        <Icon className="text-2xl " />
        <p className="font-bebas_neue subTitle2">{title}</p>
      </div>
      <ul className="mt-2">
        {textList.map((v, i) => {
          return (
            <li key={i} className="break-all">
              {v}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
