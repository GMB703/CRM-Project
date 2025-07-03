import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../../store/slices/authSlice';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Card, Button, Alert } from '../../components/ui';
import { Spinner } from '../../components/ui/Spinner';
import {
  Box,
  Grid,
  CardContent,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SuperAdminDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const [systemOverview, setSystemOverview] = useState({
    totalOrganizations: 0,
    totalUsers: 0,
    totalProjects: 0,
    totalClients: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrganizations, setRecentOrganizations] = useState([]);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Wait for auth and org data to be ready
        if (!isAuthenticated || !user) {
          throw new Error('Authentication required');
        }

        if (!user.isSuperAdmin) {
          throw new Error('Super admin access required');
        }

        // Additional initialization logic here
        
        fetchSystemOverview();
        fetchRecentUsers();
        fetchRecentOrganizations();
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [isAuthenticated, user]);

  const fetchSystemOverview = async () => {
    try {
      const response = await api.get('/super-admin/system-overview');
      setSystemOverview(response.data.data);
    } catch (error) {
      console.error('Failed to fetch system overview:', error);
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const response = await api.get('/super-admin/users');
      setRecentUsers(response.data.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recent users:', error);
    }
  };

  const fetchRecentOrganizations = async () => {
    try {
      const response = await api.get('/super-admin/organizations');
      setRecentOrganizations(response.data.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch recent organizations:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="textSecondary">
              {title}
            </Typography>
            <Typography variant="h4">
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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!user?.isSuperAdmin) {
    return (
      <div className="p-4">
        <Alert type="error" message="Access denied. Super admin privileges required." />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Super Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <h2 className="text-xl font-semibold mb-2">System Status</h2>
          <div className="space-y-2">
            <p>User: {user.email}</p>
            <p>Role: {user.role}</p>
            <p>Organization: {currentOrganization?.name || 'Not selected'}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-2">System Overview</h2>
          <div className="space-y-2">
            <p>Organizations: {systemOverview.totalOrganizations}</p>
            <p>Users: {systemOverview.totalUsers}</p>
            <p>Projects: {systemOverview.totalProjects}</p>
            <p>Clients: {systemOverview.totalClients}</p>
          </div>
        </Card>
      </div>

      <Grid container spacing={3} mt={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Users</Typography>
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/super-admin/users')}
                >
                  Manage Users
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Organization</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.organization?.name}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/super-admin/users/${user.id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Organizations</Typography>
                <Button
                  variant="outlined"
                  startIcon={<BusinessIcon />}
                  onClick={() => navigate('/super-admin/organizations')}
                >
                  Manage Organizations
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Users</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrganizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>{org.name}</TableCell>
                        <TableCell>{org.code}</TableCell>
                        <TableCell>{org.users?.length || 0}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/super-admin/organizations/${org.id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/super-admin/organizations/${org.id}/settings`)}
                          >
                            <SettingsIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default SuperAdminDashboard; 