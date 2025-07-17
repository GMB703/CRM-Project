import { Outlet } from "react-router-dom";
import { Sidebar } from "./Layout/Sidebar.jsx";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export { Layout };
