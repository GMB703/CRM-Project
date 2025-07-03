import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../../store/slices/authSlice';
import { useOrganization } from '../../contexts/OrganizationContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import LoadingSpinner from '../UI/LoadingSpinner';
import api from '../../services/api';

const AdminDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalClients: 0,
    recentUsers: []
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Wait for auth data to be ready
        if (!isAuthenticated || !user) {
          throw new Error('Authentication required');
        }

        // Check if user has admin access
        if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
          throw new Error('Admin access required');
        }

        // Fetch dashboard data
        await fetchDashboardStats();
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [isAuthenticated, user]);

  const fetchDashboardStats = async () => {
    try {
      // Fetch basic organization stats
      const [usersResponse, projectsResponse, clientsResponse] = await Promise.allSettled([
        api.get('/admin/users'),
        api.get('/admin/projects'),
        api.get('/admin/clients')
      ]);

      setStats({
        totalUsers: usersResponse.status === 'fulfilled' ? usersResponse.value.data?.length || 0 : 0,
        totalProjects: projectsResponse.status === 'fulfilled' ? projectsResponse.value.data?.length || 0 : 0,
        totalClients: clientsResponse.status === 'fulfilled' ? clientsResponse.value.data?.length || 0 : 0,
        recentUsers: usersResponse.status === 'fulfilled' ? usersResponse.value.data?.slice(0, 5) || [] : []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set default values if fetch fails
      setStats({
        totalUsers: 0,
        totalProjects: 0,
        totalClients: 0,
        recentUsers: []
      });
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Icon sx={{ fontSize: 40, color }} />
        </Box>
      </CardContent>
    </Card>
  );

  if (loading || orgLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <LoadingSpinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    return (
      <Box p={3}>
        <Alert severity="error">Access denied. Admin privileges required.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Welcome, {user.firstName} {user.lastName} | Organization: {currentOrganization?.name || 'Not selected'}
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={PeopleIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Projects"
            value={stats.totalProjects}
            icon={AssignmentIcon}
            color="#388e3c"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clients"
            value={stats.totalClients}
            icon={BusinessIcon}
            color="#f57c00"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Analytics"
            value="View"
            icon={AnalyticsIcon}
            color="#7b1fa2"
          />
        </Grid>
      </Grid>

      {/* Recent Users Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Users</Typography>
                <Button variant="outlined" color="primary">
                  Manage Users
                </Button>
              </Box>
              
              {stats.recentUsers.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.recentUsers.map((user, index) => (
                        <TableRow key={user.id || index}>
                          <TableCell>
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">
                  No users found. Users will appear here once they are added to your organization.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button variant="contained" color="primary">
                  Add New User
                </Button>
                <Button variant="outlined" color="primary">
                  View Reports
                </Button>
                <Button variant="outlined" color="primary">
                  Organization Settings
                </Button>
                <Button variant="outlined" color="primary">
                  Export Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 