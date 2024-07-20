import LoginAdvertisement from "./LoginAdvertisement";
import LoginForm from "./LoginForm";

export default function LoginBody() {
  return (
    <div className="flex h-screen w-screen ">
      <div className="w-1/2">
        <LoginAdvertisement />
      </div>
      <div className="w-1/2 min-w-250">
        <LoginForm />
      </div>
    </div>
  );
}
