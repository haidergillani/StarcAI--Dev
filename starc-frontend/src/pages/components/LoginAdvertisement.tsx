import Image from "next/image";
import logo from "../../assets/StarcAI-logo.svg";

export default function LoginAdvertisement() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-66 bg-gradient-purple">
      {/* StarcAI logo */}
      <div className="pl-208 pr-208">
        <Image src={logo} alt="logo" />
      </div>
      {/* advertising video that plays on page load */}
      <div className="relative w-2/3 ">
        <video width="auto" height="auto" controls autoPlay muted loop>
          <source src="/assets/video-walkthrough.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      {/* Marketing slogan */}
      <div className="pl-150 pr-150 text-center text-xl font-semibold text-white">
        Take control of your narrative.
      </div>
    </div>
  );
}
