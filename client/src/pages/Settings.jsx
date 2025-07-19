import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectIsSuperAdmin, updateUser } from "../store/slices/authSlice";
import { updateUser as updateUserAPI } from "../services/userAPI";
import { updateUser as updateUserRedux } from "../store/slices/authSlice";
import { getNotificationPreferences, updateNotificationPreferences } from "../services/authAPI";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { ThemeSettings } from "../components/Settings/ThemeSettings.jsx";
import SecuritySettings from "../components/Settings/SecuritySettings";
import ApiKeySettings from "../components/Settings/ApiKeySettings";

const Settings = () => {
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const isManager = user?.role === "ORG_ADMIN" || user?.role === "MANAGER";
  const isRegular = !isSuperAdmin && !isManager;
  const [activeTab, setActiveTab] = useState("profile");

  // Tab definitions based on role
  const TABS = [
    { key: "profile", label: "Profile" },
    { key: "notifications", label: "Notifications" },
    { key: "theme", label: "Theme" },
    { key: "security", label: "Security" },
  ];
  if (isSuperAdmin) TABS.unshift({ key: "system", label: "System Settings" });
  if (isManager) TABS.push({ key: "organization", label: "Organization" });
  if (isSuperAdmin || isManager) TABS.push({ key: "apiKeys", label: "API Keys" });

  const dispatch = useDispatch();
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    inAppNotifications: true,
    taskDueNotifications: true,
    projectUpdateNotifications: true,
    invoiceDueNotifications: true,
    estimateAcceptedNotifications: true,
    estimateRejectedNotifications: true,
    paymentReceivedNotifications: true,
    systemAlertNotifications: true,
    inactivityReminderNotifications: true,
    dailyDigestEnabled: false,
    weeklyDigestEnabled: false,
    digestTime: "09:00",
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Load notification preferences
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const response = await getNotificationPreferences();
        if (response.success && response.data) {
          setNotificationPreferences(response.data);
        }
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
        toast.error("Failed to load notification preferences");
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadNotificationPreferences();
  }, []);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const res = await updateUserAPI(user.id, profileForm);
      dispatch(updateUserRedux(res.data));
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSave = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await api.put("/auth/updatepassword", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (response.data.success) {
        toast.success("Password updated successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(response.data.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Password update error:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to update password";
      toast.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotificationChange = (field, value) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationSave = async () => {
    setNotificationLoading(true);
    try {
      const response = await updateNotificationPreferences(notificationPreferences);
      if (response.success) {
        toast.success("Notification preferences updated successfully");
      } else {
        toast.error(response.message || "Failed to update notification preferences");
      }
    } catch (error) {
      console.error("Notification preferences update error:", error);
      toast.error("Failed to update notification preferences");
    } finally {
      setNotificationLoading(false);
    }
  };

  const NotificationToggle = ({ label, field, description }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          notificationPreferences[field] ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        onClick={() => handleNotificationChange(field, !notificationPreferences[field])}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            notificationPreferences[field] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const TimeInput = ({ label, field, description }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      <input
        type="time"
        value={notificationPreferences[field]}
        onChange={(e) => handleNotificationChange(field, e.target.value)}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );

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

      {/* Super Admin: System Settings */}
      {activeTab === "system" && isSuperAdmin && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">System Settings (Super Admin)</h2>
          <p className="text-gray-600 mb-4">Manage application-wide settings, feature toggles, and system info here.</p>
          {/* Add system settings fields here */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">App Version</label>
            <div className="mt-1 text-gray-800">1.0.0</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Environment</label>
            <div className="mt-1 text-gray-800">Production</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Feature Toggles</label>
            <div className="mt-1 text-gray-800">(Coming soon)</div>
          </div>
        </div>
      )}

      {/* Profile Tab (All Users) */}
      {activeTab === "profile" && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">Profile</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input type="text" name="firstName" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={profileForm.firstName} onChange={handleProfileChange} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input type="text" name="lastName" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={profileForm.lastName} onChange={handleProfileChange} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={user?.email} readOnly />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" name="phone" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={profileForm.phone} onChange={handleProfileChange} />
          </div>
          <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={handleProfileSave} disabled={profileLoading}>
            {profileLoading ? "Saving..." : "Save Profile"}
          </button>
          <hr className="my-6" />
          <h3 className="text-md font-medium mb-2">Change Password</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" name="currentPassword" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={passwordForm.currentPassword} onChange={handlePasswordChange} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" name="newPassword" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={passwordForm.newPassword} onChange={handlePasswordChange} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input type="password" name="confirmPassword" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" value={passwordForm.confirmPassword} onChange={handlePasswordChange} />
          </div>
          <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={handlePasswordSave} disabled={passwordLoading}>
            {passwordLoading ? "Saving..." : "Change Password"}
          </button>
        </div>
      )}

      {/* Notifications Tab (All Users) */}
      {activeTab === "notifications" && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-medium mb-6">Notification Preferences</h2>
          
          {!preferencesLoaded ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading preferences...</p>
            </div>
          ) : (
            <>
              {/* Channel Preferences */}
              <div className="mb-8">
                <h3 className="text-md font-medium mb-4 text-gray-900">Notification Channels</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <NotificationToggle
                    label="Email Notifications"
                    field="emailNotifications"
                    description="Receive notifications via email"
                  />
                  <NotificationToggle
                    label="SMS Notifications"
                    field="smsNotifications"
                    description="Receive notifications via text message"
                  />
                  <NotificationToggle
                    label="Push Notifications"
                    field="pushNotifications"
                    description="Receive browser push notifications"
                  />
                  <NotificationToggle
                    label="In-App Notifications"
                    field="inAppNotifications"
                    description="Show notifications within the application"
                  />
                </div>
              </div>

              {/* Notification Types */}
              <div className="mb-8">
                <h3 className="text-md font-medium mb-4 text-gray-900">Notification Types</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <NotificationToggle
                    label="Task Due Reminders"
                    field="taskDueNotifications"
                    description="Get notified when tasks are due"
                  />
                  <NotificationToggle
                    label="Project Updates"
                    field="projectUpdateNotifications"
                    description="Receive updates about project status changes"
                  />
                  <NotificationToggle
                    label="Invoice Due Reminders"
                    field="invoiceDueNotifications"
                    description="Get notified when invoices are due"
                  />
                  <NotificationToggle
                    label="Estimate Accepted"
                    field="estimateAcceptedNotifications"
                    description="Get notified when estimates are accepted"
                  />
                  <NotificationToggle
                    label="Estimate Rejected"
                    field="estimateRejectedNotifications"
                    description="Get notified when estimates are rejected"
                  />
                  <NotificationToggle
                    label="Payment Received"
                    field="paymentReceivedNotifications"
                    description="Get notified when payments are received"
                  />
                  <NotificationToggle
                    label="System Alerts"
                    field="systemAlertNotifications"
                    description="Receive important system notifications"
                  />
                  <NotificationToggle
                    label="Inactivity Reminders"
                    field="inactivityReminderNotifications"
                    description="Get reminded about inactive leads"
                  />
                </div>
              </div>

              {/* Digest Settings */}
              <div className="mb-8">
                <h3 className="text-md font-medium mb-4 text-gray-900">Digest Settings</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <NotificationToggle
                    label="Daily Digest"
                    field="dailyDigestEnabled"
                    description="Receive a daily summary of all notifications"
                  />
                  <NotificationToggle
                    label="Weekly Digest"
                    field="weeklyDigestEnabled"
                    description="Receive a weekly summary of all notifications"
                  />
                  {notificationPreferences.dailyDigestEnabled && (
                    <TimeInput
                      label="Digest Time"
                      field="digestTime"
                      description="Time to send daily digest emails"
                    />
                  )}
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="mb-8">
                <h3 className="text-md font-medium mb-4 text-gray-900">Quiet Hours</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <NotificationToggle
                    label="Enable Quiet Hours"
                    field="quietHoursEnabled"
                    description="Pause notifications during specified hours"
                  />
                  {notificationPreferences.quietHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <TimeInput
                        label="Quiet Hours Start"
                        field="quietHoursStart"
                        description="When to start quiet hours"
                      />
                      <TimeInput
                        label="Quiet Hours End"
                        field="quietHoursEnd"
                        description="When to end quiet hours"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                  onClick={handleNotificationSave}
                  disabled={notificationLoading}
                >
                  {notificationLoading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Theme Tab (All Users) */}
      {activeTab === "theme" && (
        <ThemeSettings />
      )}

      {/* Security Tab (All Users) */}
      {activeTab === "security" && (
        <SecuritySettings />
      )}

      {/* Organization Tab (Manager Only) */}
      {activeTab === "organization" && isManager && (
        <div className="bg-white shadow rounded-lg p-6 max-w-xl">
          <h2 className="text-lg font-medium mb-4">Organization Settings (Manager)</h2>
          <div className="text-gray-600">(Organization settings coming soon)</div>
        </div>
      )}

      {/* API Keys Tab (Super Admin & Manager) */}
      {activeTab === "apiKeys" && (isSuperAdmin || isManager) && (
        <ApiKeySettings />
      )}
    </div>
  );
};

export { Settings };
