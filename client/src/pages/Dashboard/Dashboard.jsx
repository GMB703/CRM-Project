import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectSidebarCollapsed } from "../../store/slices/uiSlice";
import { getDashboardData } from "../../services/dashboardAPI";
import { useOrganization } from "../../contexts/OrganizationContext";

const Dashboard = () => {
  // Memoize selectors to prevent unnecessary rerenders
  const auth = useSelector((state) => state.auth);
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);
  const { currentOrganization } = useOrganization();

  // Memoize derived state
  const user = useMemo(() => auth?.user, [auth]);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentOrganization?.id) {
      fetchDashboardData();
    }
  }, [currentOrganization?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Welcome back, {user?.firstName || "User"}! Here&apos;s what&apos;s happening
          with your CRM.
        </p>
        {/* Debug Info */}
        <div className="mt-2 text-xs text-blue-600">
          Sidebar Status: {sidebarCollapsed ? "Collapsed" : "Expanded"} | User:{" "}
          {user?.email || "Not logged in"} | Org:{" "}
          {currentOrganization?.name || "Not selected"}
        </div>
      </div>

      {/* Organization Info */}
      {currentOrganization && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Current Organization
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>You&apos;re currently working with {currentOrganization.name}</p>
              {currentOrganization.code && (
                <p className="text-xs text-gray-400">
                  Code: {currentOrganization.code}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Dashboard
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">C</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Customers
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData?.overview?.totalClients || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Projects
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData?.overview?.activeProjects || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">E</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Tasks
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData?.overview?.overdueTasks || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">M</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Outstanding Invoices
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        $
                        {dashboardData?.overview?.outstandingInvoices?.toLocaleString() ||
                          "0"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {dashboardData?.recentActivities?.projects?.map(
                  (project, index) => (
                    <div
                      key={`project-${index}`}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-gray-600">
                        Project "{project.name}" {project.status.toLowerCase()}
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ),
                )}
                {dashboardData?.recentActivities?.communications?.map(
                  (comm, index) => (
                    <div
                      key={`comm-${index}`}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm text-gray-600">
                        Communication with {comm.client.firstName}{" "}
                        {comm.client.lastName}
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(comm.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                  ),
                )}
                {dashboardData?.recentActivities?.invoices?.map(
                  (invoice, index) => (
                    <div
                      key={`invoice-${index}`}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-gray-600">
                        Invoice #{invoice.number} for {invoice.client.company}
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  System Status: Operational
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  All CRM services are running normally. Frontend and backend
                  are connected.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { Dashboard };
