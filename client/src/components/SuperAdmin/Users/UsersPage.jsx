import React, { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Autocomplete,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import BlockIcon from "@mui/icons-material/Block";
import PeopleIcon from "@mui/icons-material/People";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  getUsers,
  updateUser,
  deleteUser,
  createUser,
  toggleUserStatus,
} from "../../../services/userAPI";
import { getAllOrganizationsAdmin } from "../../../services/organizationAPI";
import toast from "react-hot-toast";
import { api } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext.jsx";

const ROLES = ["SUPER_ADMIN", "ORG_ADMIN", "USER", "VIEWER"];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "USER",
    organizationId: "",
    isActive: true,
  });
  const [confirmAction, setConfirmAction] = useState({
    open: false,
    user: null,
    type: "",
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, orgsResponse] = await Promise.all([
        getUsers(),
        getAllOrganizationsAdmin(),
      ]);
      setUsers(usersResponse || []);
      setOrganizations(orgsResponse.data?.data || []);
    } catch (error) {
      toast.error("Failed to load data");
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "USER",
        organizationId: "",
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      role: "USER",
      organizationId: "",
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        toast.success("User updated successfully");
      } else {
        await createUser(formData);
        toast.success("User created successfully");
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      toast.error("Failed to save user");
      console.error("Error saving user:", error);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus(user.id);
      toast.success(
        `User ${user.isActive ? "deactivated" : "activated"} successfully`,
      );
      loadData();
    } catch (error) {
      toast.error("Failed to toggle user status");
      console.error("Error toggling user status:", error);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await deleteUser(user.id);
      toast.success("User deleted successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to delete user");
      console.error("Error deleting user:", error);
    }
  };

  const handleForceLogout = (user) => {
    setConfirmAction({ open: true, user, type: "force-logout" });
  };
  const confirmForceLogout = async () => {
    try {
      await api.post(`/users/${confirmAction.user.id}/force-logout`);
      toast.success("User forcibly logged out");
      setConfirmAction({ open: false, user: null, type: "" });
      loadData();
    } catch (error) {
      toast.error("Failed to force logout");
      setConfirmAction({ open: false, user: null, type: "" });
    }
  };
  const handleResetPassword = (user) => {
    setConfirmAction({ open: true, user, type: "reset-password" });
  };
  const confirmResetPassword = async () => {
    try {
      const res = await api.post(
        `/users/${confirmAction.user.id}/reset-password`,
      );
      setResetPasswordResult(res.data.tempPassword);
      setResetDialogOpen(true);
      toast.success("Password reset");
      setConfirmAction({ open: false, user: null, type: "" });
      loadData();
    } catch (error) {
      toast.error("Failed to reset password");
      setConfirmAction({ open: false, user: null, type: "" });
    }
  };

  const getOrganizationName = (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    return org ? org.name : "N/A";
  };

  // Define allowed roles based on current user role
  const allRoles = [
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ORG_ADMIN", label: "Org Admin" },
    { value: "USER", label: "User" },
    { value: "VIEWER", label: "Viewer" },
  ];
  const allowedRoles = allRoles; // Always show all roles for display

  return (
    <div>
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5" component="h1">
          Users
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

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
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {getOrganizationName(user.organizationId)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={
                      user.role === "SUPER_ADMIN"
                        ? "error"
                        : user.role === "ORG_ADMIN"
                          ? "warning"
                          : "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? "Active" : "Inactive"}
                    color={user.isActive ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(user)}
                    title="Edit"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleStatus(user)}
                    title={user.isActive ? "Deactivate" : "Activate"}
                  >
                    {user.isActive ? (
                      <BlockIcon fontSize="small" />
                    ) : (
                      <CheckIcon fontSize="small" />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(user)}
                    title="Delete"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
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
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
          <DialogContent>
            <Box className="space-y-4 mt-4">
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={!!editingUser}
              />
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  label="Role"
                  required
                  disabled={editingUser && editingUser.role === "SUPER_ADMIN"}
                >
                  {allowedRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Organization</InputLabel>
                <Select
                  value={formData.organizationId ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationId: e.target.value })
                  }
                  label="Organization"
                  required={formData.role !== "SUPER_ADMIN"}
                >
                  <MenuItem value="">No Organization</MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.value })
                  }
                  label="Status"
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingUser ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
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
    </div>
  );
};

export { UsersPage };
