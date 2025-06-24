import { Outlet } from "react-router";
import Sidebar from ".";
import ChatSidebar from "./ChatSidebar";

export default function ChatLayout() {
  return (
    <Sidebar>
      <ChatSidebar />
      <div className="flex-1 relative">
        <Outlet />
      </div>
    </Sidebar>
  );
}
