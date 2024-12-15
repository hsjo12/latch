export default function Loading({
  loaderType = "loader",
  className = "flex flex-col items-center justify-center w-full",
}) {
  return (
    <div className={className}>
      <span className={loaderType}></span>
    </div>
  );
}
