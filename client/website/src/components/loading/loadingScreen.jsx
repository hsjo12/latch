import Loading from "./loading";

export default function LoadingScreen({
  text = "Please hold on for a moment.",
}) {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen z-[99999] bg-[#141414cc] flex flex-col justify-center items-center gap-3">
      <Loading loaderType={"screenLoader"} />
      <p className="text-center font-bebas_neue text-[whitesmoke] loadingText tracking-[0.1rem]">
        {text}
      </p>
    </div>
  );
}
