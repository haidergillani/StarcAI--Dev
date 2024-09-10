import LoginAdvertisement from "./LoginAdvertisement";
import LoginForm from "./LoginForm";

export default function LoginBody() {
  return (
    <div className="flex h-screen w-screen">
      <div className="w-1/2 flex justify-center items-center">
        <LoginAdvertisement />
      </div>
      <div className="w-1/2 flex justify-center items-center">
        <LoginForm />
      </div>
    </div>
  );
}