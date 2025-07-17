import React from "react";
import { NavLink } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SecurityIcon from "@mui/icons-material/Security";

const SuperAdminSidebar = () => {
  const navItems = [
    {
      path: "/super-admin",
      icon: DashboardIcon,
      label: "Dashboard",
    },
    {
      path: "/super-admin/organizations",
      icon: BusinessIcon,
      label: "Organizations",
    },
    {
      path: "/super-admin/users",
      icon: PeopleIcon,
      label: "Users",
    },
    {
      path: "/super-admin/roles-permissions",
      icon: SecurityIcon,
      label: "Roles & Permissions",
    },
    {
      path: "/super-admin/analytics",
      icon: AssessmentIcon,
      label: "Analytics",
    },
    {
      path: "/super-admin/security",
      icon: SecurityIcon,
      label: "Security",
    },
    {
      path: "/super-admin/settings",
      icon: SettingsIcon,
      label: "Settings",
    },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">CRM Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Version Info */}
      <div className="p-4 text-sm text-gray-400 border-t border-gray-800">
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export { SuperAdminSidebar };
