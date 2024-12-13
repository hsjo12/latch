export default function BuyTokens() {
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-2 justify-items-center items-center">
      <div className="marketBox w-[95%] md:w-[85%] flex flex-col justify-center gap-5">
        <div className="w-full flex flex-col justify-center items-center">
          <h1 className="subTitle2">User Status</h1>
        </div>
        <div className="w-full flex flex-col justify-center">
          <p>User: 0x1212</p>
          <p>Balance: 100000 LATCH</p>
          <p>Balance: 10000 ETH</p>
        </div>
      </div>
      <div className="marketBox w-[95%] md:w-[85%] flex flex-col justify-center gap-5">
        <div className="w-full flex flex-col justify-center items-center">
          <h1 className="subTitle2">BUY $Latch</h1>
        </div>
        <div className="w-full flex flex-col justify-center">
          <p>User: 0x1212</p>
          <p>Balance: 100000 LATCH</p>
          <p>Balance: 10000 ETH</p>
        </div>
      </div>
    </section>
  );
}
