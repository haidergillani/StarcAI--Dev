import { type AppType } from "next/dist/shared/lib/utils";
import LoginBody from "./components/LoginBody";

const LoginPage: AppType = () => {
  return (
    <div className="h-screen w-screen">
      <LoginBody />
    </div>
  );
};

export default LoginPage;
