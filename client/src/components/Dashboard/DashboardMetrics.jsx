import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import dashboardAPI from '../../services/dashboardAPI';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardMetrics = () => {
  const [metrics, setMetrics] = useState({
    overview: {
      totalClients: 0,
      totalProjects: 0,
      totalEstimates: 0,
      totalInvoices: 0,
      totalTasks: 0
    },
    projects: {
      byStatus: [],
      byStage: [],
      revenue: {
        totalBudget: 0,
        totalCost: 0
      }
    },
    tasks: {
      byStatus: [],
      byPriority: [],
      efficiency: {
        avgEstimatedHours: 0,
        avgActualHours: 0
      }
    },
    financial: {
      invoices: {
        totalAmount: 0,
        amountPaid: 0,
        outstanding: 0
      },
      paymentsByMethod: [],
      estimateConversion: []
    },
    clients: {
      byStatus: [],
      bySource: [],
      communications: []
    },
    trends: {
      projects: [],
      revenue: []
    }
  });
  const [timeframe, setTimeframe] = useState(6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [timeframe]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [
        overviewMetrics,
        projectMetrics,
        taskMetrics,
        financialMetrics,
        clientMetrics,
        projectTrends,
        revenueTrends
      ] = await Promise.all([
        dashboardAPI.getMetrics(),
        dashboardAPI.getProjectMetrics(),
        dashboardAPI.getTaskMetrics(),
        dashboardAPI.getFinancialMetrics(),
        dashboardAPI.getClientMetrics(),
        dashboardAPI.getTrendData('projects', timeframe),
        dashboardAPI.getTrendData('revenue', timeframe)
      ]);

      setMetrics({
        overview: overviewMetrics.data,
        projects: projectMetrics.data,
        tasks: taskMetrics.data,
        financial: financialMetrics.data,
        clients: clientMetrics.data,
        trends: {
          projects: projectTrends.data,
          revenue: revenueTrends.data
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              {trendValue > 0 ? (
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${trendValue > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(trendValue)}%
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  const projectsChartData = {
    labels: metrics.trends.projects.map(d => d.date),
    datasets: [
      {
        label: 'New Projects',
        data: metrics.trends.projects.map(d => d._count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      }
    ]
  };

  const revenueChartData = {
    labels: metrics.trends.revenue.map(d => d.date),
    datasets: [
      {
        label: 'Revenue',
        data: metrics.trends.revenue.map(d => d._sum.totalAmount),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      }
    ]
  };

  const projectStatusChartData = {
    labels: metrics.projects.byStatus.map(d => d.status),
    datasets: [
      {
        data: metrics.projects.byStatus.map(d => d._count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(34, 197, 94, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(239, 68, 68, 0.5)',
          'rgba(139, 92, 246, 0.5)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 1
      }
    ]
  };

  const taskPriorityChartData = {
    labels: metrics.tasks.byPriority.map(d => d.priority),
    datasets: [
      {
        data: metrics.tasks.byPriority.map(d => d._count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(34, 197, 94, 0.5)'
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={metrics.overview.totalClients}
          icon={UserGroupIcon}
        />
        <StatCard
          title="Active Projects"
          value={metrics.overview.totalProjects}
          icon={BriefcaseIcon}
          subtitle={`${metrics.projects.byStatus.find(s => s.status === 'IN_PROGRESS')?._count || 0} in progress`}
        />
        <StatCard
          title="Total Tasks"
          value={metrics.overview.totalTasks}
          icon={ClipboardDocumentListIcon}
          subtitle={`${metrics.tasks.byStatus.find(s => s.status === 'PENDING')?._count || 0} pending`}
        />
        <StatCard
          title="Total Revenue"
          value={`$${metrics.financial.invoices.totalAmount.toLocaleString()}`}
          icon={CurrencyDollarIcon}
          subtitle={`$${metrics.financial.invoices.outstanding.toLocaleString()} outstanding`}
        />
      </div>

      {/* Project & Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Project Trend</h3>
          <Line data={projectsChartData} options={{ responsive: true }} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <Line data={revenueChartData} options={{ responsive: true }} />
        </div>
      </div>

      {/* Project Status & Task Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Projects by Status</h3>
          <div className="aspect-square">
            <Doughnut data={projectStatusChartData} options={{ responsive: true }} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
          <div className="aspect-square">
            <Doughnut data={taskPriorityChartData} options={{ responsive: true }} />
          </div>
        </div>
      </div>

      {/* Task Efficiency */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Task Efficiency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Average Estimated Hours</p>
            <p className="text-2xl font-semibold mt-2">
              {metrics.tasks.efficiency.avgEstimatedHours.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Actual Hours</p>
            <p className="text-2xl font-semibold mt-2">
              {metrics.tasks.efficiency.avgActualHours.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-end space-x-2">
        {[3, 6, 12].map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={`px-4 py-2 rounded-md text-sm ${
              timeframe === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t} Months
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardMetrics; 