import { type AppType } from "next/dist/shared/lib/utils";
import DocsBody from "./components/DocsBody";

const DocsPage: AppType = () => {
  return (
    <div className="h-screen w-screen">
      <DocsBody />
    </div>
  );
};

export default DocsPage;
