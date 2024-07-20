import Menu from "./Menu";
import DocsContainer from "./DocsContainer";

export default function DocsBody() {
  return (
    <div className="flex h-screen w-screen">
      <div className="w-208 bg-gray-20 p-83 pr-208">
        <Menu defaultOpen={true} />
      </div>
      <div className="h-screen w-screen bg-white">
        <DocsContainer />
      </div>
    </div>
  );
}
