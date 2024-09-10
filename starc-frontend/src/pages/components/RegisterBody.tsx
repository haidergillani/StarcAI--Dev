import LoginAdvertisement from "./LoginAdvertisement";
import RegisterForm from "./RegisterForm";

export default function RegisterBody() {
  return (
    <div className="flex h-screen w-screen ">
      <div className="w-1/2 flex justify-center items-center">
        <LoginAdvertisement />
      </div>
      <div className="w-1/2 flex justify-center items-center">
        <RegisterForm />
      </div>
    </div>
  );
}
