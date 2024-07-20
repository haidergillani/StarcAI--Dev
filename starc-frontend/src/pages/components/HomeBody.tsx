import Content from "./Content";
import Sidebar from "./Sidebar";

export default function HomeBody() {
  return (
    <div className="flex w-screen h-screen">
      <div className="flex-1 py-4">
      <Content document={{ id: 123, title: "TestTitle", text: "Sample text" }} />
      </div>
      <div className="w-1/3 pt-42 pb-42 pl-33 pr-33 bg-background min-w-250">
        <Sidebar />
      </div>
    </div>
  )
}
