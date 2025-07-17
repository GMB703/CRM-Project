import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext.jsx";

const UserManagement = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "USER",
    organizationId: "",
    password: "",
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState(null);
  const [confirmAction, setConfirmAction] = useState({
    open: false,
    user: null,
    type: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/super-admin/users");
      setUsers(response.data.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await api.get("/super-admin/organizations");
      setOrganizations(response.data.data);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        password: "",
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "USER",
        organizationId: "",
        password: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      role: "USER",
      organizationId: "",
      password: "",
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedUser) {
        await api.put(`/super-admin/users/${selectedUser.id}`, formData);
      } else {
        await api.post("/super-admin/users", formData);
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/super-admin/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await api.put(`/super-admin/users/${user.id}`, {
        ...user,
        isActive: !user.isActive,
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  // Add force logout handler
  const handleForceLogout = async (user) => {
    setConfirmAction({ open: true, user, type: "force-logout" });
  };
  const confirmForceLogout = async () => {
    try {
      await api.post(`/users/${confirmAction.user.id}/force-logout`);
      fetchUsers();
      setConfirmAction({ open: false, user: null, type: "" });
    } catch (error) {
      console.error("Failed to force logout:", error);
      setConfirmAction({ open: false, user: null, type: "" });
    }
  };
  // Add reset password handler
  const handleResetPassword = async (user) => {
    setConfirmAction({ open: true, user, type: "reset-password" });
  };
  const confirmResetPassword = async () => {
    try {
      const res = await api.post(
        `/users/${confirmAction.user.id}/reset-password`,
      );
      setResetPasswordResult(res.data.tempPassword);
      setResetDialogOpen(true);
      fetchUsers();
      setConfirmAction({ open: false, user: null, type: "" });
    } catch (error) {
      console.error("Failed to reset password:", error);
      setConfirmAction({ open: false, user: null, type: "" });
    }
  };

  // Define allowed roles based on current user role
  const allRoles = [
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ORG_ADMIN", label: "Org Admin" },
    { value: "USER", label: "User" },
    { value: "VIEWER", label: "Viewer" },
  ];
  const allowedRoles =
    currentUser?.role === "SUPER_ADMIN"
      ? allRoles
      : allRoles.filter((r) => r.value !== "SUPER_ADMIN");

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.organization?.name}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleUserStatus(user)}
                          color={user.isActive ? "success" : "error"}
                        >
                          {user.isActive ? <LockOpenIcon /> : <LockIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleForceLogout(user)}
                          title="Force Logout"
                        >
                          <PowerSettingsNewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleResetPassword(user)}
                          title="Reset Password"
                        >
                          <RestartAltIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={users.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            {!selectedUser && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                  required
                >
                  {allowedRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Organization</InputLabel>
                <Select
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleInputChange}
                  label="Organization"
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Force Logout and Reset Password */}
      <Dialog
        open={confirmAction.open}
        onClose={() => setConfirmAction({ open: false, user: null, type: "" })}
      >
        <DialogTitle>
          {confirmAction.type === "force-logout"
            ? "Force Logout User"
            : "Reset User Password"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {confirmAction.type === "force-logout"
              ? "force logout"
              : "reset the password for"}{" "}
            user <b>{confirmAction.user?.email}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmAction({ open: false, user: null, type: "" })
            }
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={
              confirmAction.type === "force-logout"
                ? confirmForceLogout
                : confirmResetPassword
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog to show new temp password after reset */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Password Reset Successful</DialogTitle>
        <DialogContent>
          <Typography>New temporary password:</Typography>
          <Box
            mt={2}
            mb={2}
            p={2}
            bgcolor="#f5f5f5"
            borderRadius={2}
            fontFamily="monospace"
          >
            {resetPasswordResult}
          </Box>
          <Typography>
            Please copy and share this password securely with the user.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { UserManagement };
