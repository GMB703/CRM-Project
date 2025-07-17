import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/clients", label: "Clients", icon: "👥" },
    { path: "/projects", label: "Projects", icon: "📁" },
    { path: "/tasks", label: "Tasks", icon: "✓" },
    { path: "/reports", label: "Reports", icon: "📈" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg h-[calc(100vh-4rem)]">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export { Sidebar };
