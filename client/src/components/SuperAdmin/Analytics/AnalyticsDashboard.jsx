import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getSystemMetrics,
  getOrganizationMetrics,
  getUserMetrics,
} from "../../../services/analyticsAPI";
import { useOrganization } from "../../../contexts/OrganizationContext.jsx";
import toast from "react-hot-toast";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const MetricCard = ({ title, value, subtitle }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    loadMetrics();
  }, [currentOrganization]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await getSystemMetrics();
      setMetrics(response.data);
    } catch (error) {
      toast.error("Failed to load analytics data");
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress />
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box className="p-4">
        <Typography color="error">Failed to load analytics data</Typography>
      </Box>
    );
  }

  // Prepare data for organization size chart
  const orgSizeData = Object.entries(metrics.organizations.bySize).map(
    ([size, count]) => ({
      name: size.charAt(0).toUpperCase() + size.slice(1),
      value: count,
    }),
  );

  // Prepare data for user roles chart
  const userRolesData = Object.entries(metrics.users.byRole).map(
    ([role, count]) => ({
      name: role,
      Users: count,
    }),
  );

  return (
    <Box className="p-4">
      <Typography variant="h4" gutterBottom>
        System Analytics
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Organizations"
            value={metrics.organizations.total}
            subtitle={`${metrics.organizations.active} Active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={metrics.users.total}
            subtitle={`${metrics.users.active} Active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Rate"
            value={`${((metrics.users.active / metrics.users.total) * 100).toFixed(1)}%`}
            subtitle="User Activation"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Users/Org"
            value={(metrics.users.total / metrics.organizations.total).toFixed(
              1,
            )}
            subtitle="Users per Organization"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Organization Size Distribution */}
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Organization Size Distribution
            </Typography>
            <Box className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orgSizeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {orgSizeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* User Roles Distribution */}
        <Grid item xs={12} md={6}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              User Roles Distribution
            </Typography>
            <Box className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userRolesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Users" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper>
            <CardHeader title="Recent Activity" />
            <Divider />
            <List>
              {metrics.recentActivity.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemText
                    primary={activity.email}
                    secondary={`Organization: ${activity.organization}`}
                  />
                  <Chip
                    label={new Date(activity.createdAt).toLocaleDateString()}
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export { AnalyticsDashboard };
