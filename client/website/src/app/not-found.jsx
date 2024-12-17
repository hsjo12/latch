import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="gap-5 w-full logo h-screen flex flex-col justify-center items-center font-bebas_neue">
      <h1>😵😵😵 Page not found 😵😵😵</h1>
      <Link href="/">
        <button className="btn subTitle2">Go Back To Home</button>
      </Link>
    </main>
  );
}
