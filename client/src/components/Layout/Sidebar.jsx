import React, { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  HomeIcon,
  UserGroupIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowsRightLeftIcon,
  DocumentTextIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useOrganization } from "../../contexts/OrganizationContext.jsx";
import { useAuth } from "../../hooks/useAuth";
import { OrganizationSwitcher } from "../Organization";
import {
  selectSidebarCollapsed,
  toggleSidebarCollapsed,
} from "../../store/slices/uiSlice";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
} from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ForumIcon from "@mui/icons-material/Forum";
import GroupsIcon from "@mui/icons-material/Groups";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const Sidebar = ({ isOpen, onToggle }) => {
  const dispatch = useDispatch();
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);
  const { theme } = useTheme();
  const { currentOrganization, availableOrganizations } = useOrganization();
  const { user } = useAuth();
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [expanded, setExpanded] = useState("");
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN" || user?.role === "OWNER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const handleExpandClick = (itemTitle) => {
    setExpanded(expanded === itemTitle ? "" : itemTitle);
  };

  const handleToggle = () => {
    dispatch(toggleSidebarCollapsed());
    if (onToggle) onToggle();
  };

  // SuperAdmin can access all features, regular admins can access basic admin features
  const menuItems = [
    {
      title: "Dashboard",
      icon: <DashboardIcon />,
      href: "/dashboard",
    },
    {
      title: "Leads",
      icon: <PeopleIcon />,
      href: "/dashboard/leads",
    },
    {
      title: "Projects",
      icon: <AssignmentIcon />,
      href: "/dashboard/projects",
    },
    {
      title: "Tasks",
      icon: <CheckBoxIcon />,
      href: "/dashboard/tasks",
    },
    {
      title: "Estimates",
      icon: <ReceiptLongIcon />,
      href: "/dashboard/estimates",
    },
    {
      title: "Communication",
      icon: <ForumIcon />,
      href: "/dashboard/communication",
    },
    {
      title: "Customers",
      icon: <UserGroupIcon className="h-6 w-6" />,
      href: "/dashboard/customers",
    },
    ...(isAdmin
      ? [
          {
            title: "Admin",
            icon: <UserGroupIcon className="h-6 w-6" />,
            href: "/admin",
            subItems: [
              { title: "User Management", href: "/admin/users" },
              { title: "Organization Settings", href: "/admin/organization" },
            ],
          },
        ]
      : []),
    ...(isSuperAdmin
      ? [
          {
            title: "Super Admin",
            icon: <EmojiEventsIcon />,
            href: "/super-admin",
            subItems: [
              {
                title: "Organization Management",
                href: "/super-admin/organizations",
              },
              { title: "User Management", href: "/super-admin/users" },
              { title: "System Settings", href: "/super-admin/settings" },
            ],
          },
        ]
      : []),
    {
      title: "Settings",
      icon: <SettingsIcon />,
      href: isSuperAdmin ? "/super-admin/settings" : "/dashboard/settings",
    },
  ];

  const allMenuItems = menuItems;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={handleToggle}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sidebarCollapsed ? (
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          sidebar fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarCollapsed ? "-translate-x-full lg:w-16" : "translate-x-0"}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div
            className={`${sidebarCollapsed ? "px-2 py-2" : "px-4 py-3"} border-b border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  src={theme.logo || "/logo.svg"}
                  alt="Logo"
                  className={`${sidebarCollapsed ? "w-8 h-8" : "w-10 h-10"}`}
                />
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {theme.appName || "CRM System"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Organization Info */}
          {currentOrganization && (
            <div
              className={`${sidebarCollapsed ? "px-2 py-2" : "px-4 py-3"} border-b border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={sidebarCollapsed ? "w-full text-center" : "flex-1"}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Organization
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {sidebarCollapsed
                      ? currentOrganization.code ||
                        currentOrganization.name.substring(0, 2)
                      : currentOrganization.name}
                  </div>
                  {!sidebarCollapsed && currentOrganization.code && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {currentOrganization.code}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowOrgSwitcher(true)}
                    className={`${sidebarCollapsed ? "w-full mt-2" : "ml-2"} p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                    title="Switch Organization"
                  >
                    <ArrowsRightLeftIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {allMenuItems.map((item) =>
              item.subItems ? (
                <Box key={item.title}>
                  <ListItemButton
                    onClick={() => handleExpandClick(item.title)}
                    sx={{
                      minHeight: 48,
                      justifyContent: sidebarCollapsed ? "center" : "initial",
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: sidebarCollapsed ? "auto" : 3,
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      sx={{ opacity: sidebarCollapsed ? 0 : 1 }}
                    />
                    {!sidebarCollapsed && (
                      <ExpandMore
                        sx={{
                          transform:
                            expanded === item.title
                              ? "rotate(180deg)"
                              : "rotate(0)",
                          transition: "0.2s",
                        }}
                      />
                    )}
                  </ListItemButton>
                  <Collapse
                    in={expanded === item.title && !sidebarCollapsed}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {item.subItems.map((child) => (
                        <ListItemButton
                          key={child.title}
                          component={Link}
                          to={child.href}
                          selected={location.pathname === child.href}
                          sx={{
                            pl: 4,
                            minHeight: 48,
                            justifyContent: sidebarCollapsed
                              ? "center"
                              : "initial",
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: sidebarCollapsed ? "auto" : 3,
                              justifyContent: "center",
                            }}
                          >
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.title}
                            sx={{ opacity: sidebarCollapsed ? 0 : 1 }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              ) : (
                <ListItemButton
                  key={item.title}
                  component={Link}
                  to={item.href}
                  selected={location.pathname === item.href}
                  sx={{
                    minHeight: 48,
                    justifyContent: sidebarCollapsed ? "center" : "initial",
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: sidebarCollapsed ? "auto" : 3,
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    sx={{ opacity: sidebarCollapsed ? 0 : 1 }}
                  />
                </ListItemButton>
              ),
            )}
          </nav>

          {/* Collapse toggle (desktop only) */}
          <div className="hidden lg:block p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleToggle}
              className="w-full flex items-center justify-center px-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <Bars3Icon className="h-5 w-5" />
              ) : (
                <>
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Collapse
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-gray-600 bg-opacity-75"
          onClick={handleToggle}
        />
      )}

      {/* Organization Switcher Modal - Only for Super Admins */}
      {isAdmin && (
        <OrganizationSwitcher
          isOpen={showOrgSwitcher}
          onClose={() => setShowOrgSwitcher(false)}
        />
      )}
    </>
  );
};

export { Sidebar };
