import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../hooks/useAuth';
import { OrganizationSwitcher } from '../Organization';
import { 
  selectSidebarCollapsed,
  toggleSidebarCollapsed 
} from '../../store/slices/uiSlice';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Customers', href: '/customers', icon: UserGroupIcon },
  { name: 'Estimates', href: '/estimates', icon: DocumentTextIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Communication', href: '/communication', icon: ChatBubbleLeftRightIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const Sidebar = ({ isOpen, onToggle }) => {
  const dispatch = useDispatch();
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);
  const { theme } = useTheme();
  const { currentOrganization, availableOrganizations } = useOrganization();
  const { user } = useAuth();
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);

  const handleToggle = () => {
    dispatch(toggleSidebarCollapsed());
    if (onToggle) onToggle();
  };

  // Check if user can switch organizations
  const canSwitchOrganizations = user?.role === 'SUPER_ADMIN' && (availableOrganizations?.length > 1);

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
          ${sidebarCollapsed ? '-translate-x-full lg:w-16' : 'translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
            <div className="logo-container flex items-center">
              {theme?.logoUrl && !sidebarCollapsed && (
                <img
                  src={theme.logoUrl}
                  alt={theme.companyName || 'CRM'}
                  className="h-8 w-auto mr-3"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {!sidebarCollapsed && (
                <span className="text-white font-semibold text-lg">
                  {theme?.companyName || 'CRM System'}
                </span>
              )}
              {sidebarCollapsed && (
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">
                    {(theme?.companyName || 'CRM').charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Organization Selector */}
          {!sidebarCollapsed && currentOrganization && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Organization
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {currentOrganization.name}
                  </div>
                  {currentOrganization.code && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {currentOrganization.code}
                    </div>
                  )}
                </div>
                {canSwitchOrganizations && (
                  <button
                    onClick={() => setShowOrgSwitcher(true)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Switch Organization"
                  >
                    <ArrowsRightLeftIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {canSwitchOrganizations && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Super Admin Access
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `nav-link group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'nav-link-active bg-blue-100 text-blue-600 border-r-2 border-blue-600'
                      : 'nav-link-inactive text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
                title={sidebarCollapsed ? item.name : ''}
              >
                <item.icon
                  className={`${
                    sidebarCollapsed ? 'mr-0' : 'mr-3'
                  } h-5 w-5 flex-shrink-0`}
                  aria-hidden="true"
                />
                {!sidebarCollapsed && item.name}
              </NavLink>
            ))}
          </nav>

          {/* Collapse toggle (desktop only) */}
          <div className="hidden lg:block p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleToggle}
              className="w-full flex items-center justify-center px-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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

      {/* Organization Switcher Modal */}
      <OrganizationSwitcher
        isOpen={showOrgSwitcher}
        onClose={() => setShowOrgSwitcher(false)}
      />
    </>
  );
};

export default Sidebar; 