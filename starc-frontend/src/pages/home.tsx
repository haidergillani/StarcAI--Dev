import { type AppType } from "next/dist/shared/lib/utils";
import HomeBody from "./components/HomeBody";
import Menu from "./components/Menu";

const HomePage: AppType = () => {
  return (
    <div className="h-screen w-screen">
      <Menu></Menu>
      <HomeBody></HomeBody>
    </div>
  );
};

export default HomePage;
