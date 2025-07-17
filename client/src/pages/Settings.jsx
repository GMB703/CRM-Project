import React, { useState } from "react";
import { useAuth, usePermissions } from "../hooks/useAuth";

const Settings = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state (placeholder)
  const [profile, setProfile] = useState({
    name: "User Name",
    email: "user@email.com",
    phone: "",
  });
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    inApp: true,
  });
  const [theme, setTheme] = useState("light");

  // Organization state (admin only, placeholder)
  const [org, setOrg] = useState({
    name: "Acme Corp",
    logo: null,
    contact: "info@acme.com",
  });

  // API Keys (admin only, placeholder)
  const [apiKeys] = useState([
    { id: 1, key: "sk-1234...", created: "2024-07-01" },
    { id: 2, key: "sk-5678...", created: "2024-07-02" },
  ]);

  // Security (placeholder)
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Tab definitions
  const TABS = [
    { key: "profile", label: "Profile" },
    { key: "notifications", label: "Notifications" },
    { key: "theme", label: "Theme" },
    { key: "security", label: "Security" },
  ];
  if (isAdmin || isSuperAdmin)
    TABS.push({ key: "organization", label: "Organization" });
  if (isAdmin || isSuperAdmin) TABS.push({ key: "apiKeys", label: "API Keys" });

  // Handlers (placeholder logic)
  const handleProfileChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) =>
    setPassword({ ...password, [e.target.name]: e.target.value });
  const handleNotificationsChange = (e) =>
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  const handleThemeChange = (e) => setTheme(e.target.value);
  const handleOrgChange = (e) =>
    setOrg({ ...org, [e.target.name]: e.target.value });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
      <div className="flex space-x-4 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`py-2 px-4 -mb-px border-b-2 font-medium transition-colors duration-150 ${activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-blue-600"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">Profile</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="pt-4">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Profile
              </button>
            </div>
          </form>
          <hr className="my-6" />
          <h3 className="text-md font-medium mb-2">Change Password</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                name="current"
                value={password.current}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                name="new"
                value={password.new}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirm"
                value={password.confirm}
                onChange={handlePasswordChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div className="pt-4">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">Notification Preferences</h2>
          <form className="space-y-4">
            <div className="flex items-center">
              <input
                id="email"
                name="email"
                type="checkbox"
                checked={notifications.email}
                onChange={handleNotificationsChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label
                htmlFor="email"
                className="ml-2 block text-sm text-gray-700"
              >
                Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="sms"
                name="sms"
                type="checkbox"
                checked={notifications.sms}
                onChange={handleNotificationsChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="sms" className="ml-2 block text-sm text-gray-700">
                SMS Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="inApp"
                name="inApp"
                type="checkbox"
                checked={notifications.inApp}
                onChange={handleNotificationsChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label
                htmlFor="inApp"
                className="ml-2 block text-sm text-gray-700"
              >
                In-App Notifications
              </label>
            </div>
            <div className="pt-4">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === "theme" && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">Theme & Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={theme}
                onChange={handleThemeChange}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Two-Factor Authentication (2FA)</span>
              <button
                type="button"
                onClick={() => setMfaEnabled((v) => !v)}
                className={`px-3 py-1 rounded ${mfaEnabled ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {mfaEnabled ? "Enabled" : "Enable"}
              </button>
            </div>
            <div>
              <span className="text-sm text-gray-600">
                Recent Login Activity (placeholder)
              </span>
              <ul className="mt-2 text-xs text-gray-500 list-disc list-inside">
                <li>2024-07-01 10:00 - Chrome, MacOS - Success</li>
                <li>2024-06-30 22:15 - Mobile, iOS - Success</li>
              </ul>
            </div>
            <div>
              <span className="text-sm text-gray-600">
                Active Sessions (placeholder)
              </span>
              <ul className="mt-2 text-xs text-gray-500 list-disc list-inside">
                <li>Current Device - Chrome, MacOS</li>
                <li>iPhone - Mobile, iOS</li>
              </ul>
              <button className="mt-2 text-xs text-red-600 underline">
                Logout from all other sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization Tab (Admin Only) */}
      {activeTab === "organization" && (isAdmin || isSuperAdmin) && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">Organization Settings</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                type="text"
                name="name"
                value={org.name}
                onChange={handleOrgChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Email
              </label>
              <input
                type="email"
                name="contact"
                value={org.contact}
                onChange={handleOrgChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            {/* Logo upload can be added here */}
            <div className="pt-4">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Organization
              </button>
            </div>
          </form>
          <hr className="my-6" />
          <div>
            <span className="text-sm text-gray-600">Manage Users</span>
            <button className="ml-2 text-xs text-blue-600 underline">
              Go to User Management
            </button>
          </div>
        </div>
      )}

      {/* API Keys Tab (Admin Only) */}
      {activeTab === "apiKeys" && (isAdmin || isSuperAdmin) && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">API Keys</h2>
          <div className="mb-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Generate New API Key
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {apiKeys.map((key) => (
              <li
                key={key.id}
                className="py-2 flex items-center justify-between"
              >
                <span className="font-mono text-xs">{key.key}</span>
                <span className="text-xs text-gray-500">
                  Created: {key.created}
                </span>
                <button className="ml-2 text-xs text-red-600 underline">
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { Settings };
