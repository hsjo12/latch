export default function UserStatus() {
  return (
    <div className="marketBox w-full h-full">
      <div className="w-full flex flex-col justify-center items-start ">
        <h1 className="w-full subTitle2 marketBoxHead">User Status</h1>
      </div>
      <div className="w-full flex flex-col justify-center pt-1">
        <div className="marketBoxContents">
          <p className="text-center">User</p>
          <p className="text-center">0x1212</p>
        </div>
        <div className="marketBoxContents">
          <p className="text-center">Balance</p>
          <p className="text-center">100000 Latch</p>
        </div>
        <div className="marketBoxContents">
          <p className="text-center">10000</p>
          <p className="text-center">ETH</p>
        </div>
        <div className="bg-[#1f378198] h-full flex flex-col justify-center items-center rounded-b-lg">
          <p>WELCOME TO LATCH</p>
          <p>WELCOME TO LATCH</p>
        </div>
      </div>
    </div>
  );
}
