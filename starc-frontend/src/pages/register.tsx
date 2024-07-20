import { type AppType } from "next/dist/shared/lib/utils";
import RegisterBody from "./components/RegisterBody";

const RegisterPage: AppType = () => {
  return (
    <div className="h-screen w-screen">
      <RegisterBody />
    </div>
  );
};

export default RegisterPage;
