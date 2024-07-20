import LoginAdvertisement from "./LoginAdvertisement";
import RegisterForm from "./RegisterForm";

export default function RegisterBody() {
  return (
    <div className="flex h-screen w-screen ">
      <div className="w-1/2">
        <LoginAdvertisement />
      </div>
      <div className="w-1/2 min-w-250">
        <RegisterForm />
      </div>
    </div>
  );
}
