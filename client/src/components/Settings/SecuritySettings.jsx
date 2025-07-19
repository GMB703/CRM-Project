import React, { useState, useEffect } from 'react';
import { 
  getLoginHistory, 
  getActiveSessions, 
  logoutAllSessions, 
  getSecuritySettings, 
  updateSecuritySettings 
} from '../../services/authAPI';

const SecuritySettings = () => {
  const [loginHistory, setLoginHistory] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    lastPasswordChange: null,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    passwordAge: null
  });
  const [loading, setLoading] = useState({
    loginHistory: false,
    activeSessions: false,
    securitySettings: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading({ loginHistory: true, activeSessions: true, securitySettings: true });
      
      const [historyRes, sessionsRes, settingsRes] = await Promise.all([
        getLoginHistory(),
        getActiveSessions(),
        getSecuritySettings()
      ]);

      setLoginHistory(historyRes.data || []);
      setActiveSessions(sessionsRes.data || []);
      setSecuritySettings(settingsRes.data || {});
    } catch (err) {
      setError('Failed to load security data');
      console.error('Error loading security data:', err);
    } finally {
      setLoading({ loginHistory: false, activeSessions: false, securitySettings: false });
    }
  };

  const handleTwoFactorToggle = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const newSettings = {
        twoFactorEnabled: !securitySettings.twoFactorEnabled
      };
      
      const response = await updateSecuritySettings(newSettings);
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: response.data.twoFactorEnabled
      }));
      
      setSuccess(`Two-factor authentication ${newSettings.twoFactorEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      setError('Failed to update two-factor authentication settings');
      console.error('Error updating 2FA settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!window.confirm('Are you sure you want to logout from all other sessions? This will invalidate all other active sessions.')) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, activeSessions: true }));
      await logoutAllSessions();
      setSuccess('Successfully logged out from all other sessions');
      // Reload active sessions
      const sessionsRes = await getActiveSessions();
      setActiveSessions(sessionsRes.data || []);
    } catch (err) {
      setError('Failed to logout from all sessions');
      console.error('Error logging out all sessions:', err);
    } finally {
      setLoading(prev => ({ ...prev, activeSessions: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getLocationFromIP = (ipAddress) => {
    // In a real implementation, you'd use a geolocation service
    if (!ipAddress) return 'Unknown';
    if (ipAddress === '127.0.0.1' || ipAddress === '::1') return 'Local';
    return ipAddress;
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    
    return 'Other Browser';
  };

  const getPasswordStrength = (age) => {
    if (!age) return { level: 'unknown', color: 'gray', text: 'Unknown' };
    if (age < 30) return { level: 'good', color: 'green', text: 'Good' };
    if (age < 90) return { level: 'warning', color: 'yellow', text: 'Consider updating' };
    return { level: 'critical', color: 'red', text: 'Update recommended' };
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Security Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Password Age</div>
            <div className="text-lg font-semibold">
              {securitySettings.passwordAge ? `${securitySettings.passwordAge} days` : 'Unknown'}
            </div>
            {securitySettings.passwordAge && (
              <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block bg-${getPasswordStrength(securitySettings.passwordAge).color}-100 text-${getPasswordStrength(securitySettings.passwordAge).color}-800`}>
                {getPasswordStrength(securitySettings.passwordAge).text}
              </div>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Failed Login Attempts</div>
            <div className="text-lg font-semibold">{securitySettings.failedLoginAttempts}</div>
            <div className="text-xs text-gray-500">Recent attempts</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Active Sessions</div>
            <div className="text-lg font-semibold">{activeSessions.length}</div>
            <div className="text-xs text-gray-500">Current devices</div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Two-Factor Authentication (2FA)</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <button
            onClick={handleTwoFactorToggle}
            disabled={saving}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              securitySettings.twoFactorEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50`}
          >
            {saving ? 'Updating...' : securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
        
        {securitySettings.twoFactorEnabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">Two-factor authentication is enabled</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your account is protected with an additional security layer.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800 font-medium">Two-factor authentication is disabled</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Enable 2FA to add an extra layer of security to your account.
            </p>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Active Sessions</h3>
            <p className="text-sm text-gray-600">Manage your active login sessions</p>
          </div>
          <button
            onClick={handleLogoutAllSessions}
            disabled={loading.activeSessions || activeSessions.length <= 1}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading.activeSessions ? 'Processing...' : 'Logout from all other sessions'}
          </button>
        </div>

        {loading.activeSessions ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading sessions...</p>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No active sessions found</div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">{getDeviceInfo(session.userAgent)}</div>
                    <div className="text-sm text-gray-600">
                      {getLocationFromIP(session.ipAddress)} • {formatDate(session.lastActivity)}
                    </div>
                  </div>
                </div>
                {session.isCurrent && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Current Session
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login History */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Recent Login History</h3>
        
        {loading.loginHistory ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading login history...</p>
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No login history available</div>
        ) : (
          <div className="space-y-3">
            {loginHistory.map((login) => (
              <div key={login.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${login.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="font-medium">{getDeviceInfo(login.userAgent)}</div>
                    <div className="text-sm text-gray-600">
                      {getLocationFromIP(login.ipAddress)} • {formatDate(login.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${login.success ? 'text-green-600' : 'text-red-600'}`}>
                    {login.success ? 'Successful' : 'Failed'}
                  </div>
                  <div className="text-xs text-gray-500">{login.device}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Recommendations */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Security Recommendations</h3>
        <div className="space-y-3">
          {!securitySettings.twoFactorEnabled && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium text-yellow-800">Enable Two-Factor Authentication</div>
                <div className="text-sm text-yellow-700">Add an extra layer of security to protect your account</div>
              </div>
            </div>
          )}
          
          {securitySettings.passwordAge && securitySettings.passwordAge > 90 && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium text-red-800">Update Your Password</div>
                <div className="text-sm text-red-700">Your password is over 90 days old. Consider updating it for better security.</div>
              </div>
            </div>
          )}
          
          {activeSessions.length > 1 && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-medium text-blue-800">Multiple Active Sessions</div>
                <div className="text-sm text-blue-700">You have {activeSessions.length} active sessions. Review and logout from unused devices.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings; 