import Image from "next/image";
import logo from "../../assets/StarcAI-logo.svg";
import login from "../../../public/assets/login.png";

export default function LoginAdvertisement() {
  return (
    <div className="h-full w-full">
      <Image className=" h-full w-full" src={login} alt="logo" />
    </div>
  );
}