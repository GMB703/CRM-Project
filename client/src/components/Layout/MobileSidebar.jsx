import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { setMobileSidebarOpen } from "../../store/slices/uiSlice";
import { useOrganization } from "../../contexts/OrganizationContext.jsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Customers", href: "/dashboard/customers", icon: UsersIcon },
  { name: "Organizations", href: "/organizations", icon: BuildingOfficeIcon },
  {
    name: "Communication",
    href: "/dashboard/communication",
    icon: ChatBubbleLeftRightIcon,
  },
  { name: "Reports", href: "/dashboard/reports", icon: DocumentTextIcon },
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
];

const MobileSidebar = () => {
  const dispatch = useDispatch();
  const { currentOrganization } = useOrganization();

  const closeSidebar = () => {
    dispatch(setMobileSidebarOpen(false));
  };

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
      <div className="flex h-16 shrink-0 items-center justify-between">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CRM</span>
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">
            CRM System
          </span>
        </div>
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700"
          onClick={closeSidebar}
        >
          <span className="sr-only">Close sidebar</span>
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Organization info */}
      {currentOrganization && (
        <div className="px-3 py-2 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Current Organization
          </p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {currentOrganization.name}
          </p>
        </div>
      )}

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                      }`
                    }
                  >
                    <item.icon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export { MobileSidebar };
