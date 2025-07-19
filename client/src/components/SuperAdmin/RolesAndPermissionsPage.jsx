import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Grid,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { api } from "../../services/api";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsSuperAdmin } from "../../store/slices/authSlice";

const RolesAndPermissionsPage = () => {
  const currentUser = useSelector(selectCurrentUser);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  // Dialog state
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [permissionForm, setPermissionForm] = useState({
    module: "",
    action: "",
    description: "",
  });
  // Assignment state
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    type: "",
    target: null,
  });

  useEffect(() => {
    if (isSuperAdmin || currentUser?.role === "SUPER_ADMIN") {
      loadData();
    }
  }, [currentUser, isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        api.get("/permissions/roles"),
        api.get("/permissions/permissions"),
        api.get("/users"),
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissions(permsRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to load data",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Role CRUD ---
  const handleOpenRoleDialog = (role = null) => {
    setEditingRole(role);
    setRoleForm(
      role
        ? { name: role.name, description: role.description }
        : { name: "", description: "" },
    );
    setOpenRoleDialog(true);
  };
  const handleCloseRoleDialog = () => {
    setOpenRoleDialog(false);
    setEditingRole(null);
    setRoleForm({ name: "", description: "" });
  };
  const handleSaveRole = async () => {
    try {
      if (editingRole) {
        await api.put(`/permissions/roles/${editingRole.id}`, roleForm);
        setSnackbar({
          open: true,
          message: "Role updated",
          severity: "success",
        });
      } else {
        await api.post("/permissions/roles", roleForm);
        setSnackbar({
          open: true,
          message: "Role created",
          severity: "success",
        });
      }
      handleCloseRoleDialog();
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to save role",
        severity: "error",
      });
    }
  };
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await api.delete(`/permissions/roles/${roleId}`);
      setSnackbar({ open: true, message: "Role deleted", severity: "success" });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to delete role",
        severity: "error",
      });
    }
  };

  // --- Permission CRUD ---
  const handleOpenPermissionDialog = (perm = null) => {
    setEditingPermission(perm);
    setPermissionForm(
      perm
        ? {
            module: perm.module,
            action: perm.action,
            description: perm.description,
          }
        : { module: "", action: "", description: "" },
    );
    setOpenPermissionDialog(true);
  };
  const handleClosePermissionDialog = () => {
    setOpenPermissionDialog(false);
    setEditingPermission(null);
    setPermissionForm({ module: "", action: "", description: "" });
  };
  const handleSavePermission = async () => {
    try {
      if (editingPermission) {
        await api.put(
          `/permissions/permissions/${editingPermission.id}`,
          permissionForm,
        );
        setSnackbar({
          open: true,
          message: "Permission updated",
          severity: "success",
        });
      } else {
        await api.post("/permissions/permissions", permissionForm);
        setSnackbar({
          open: true,
          message: "Permission created",
          severity: "success",
        });
      }
      handleClosePermissionDialog();
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to save permission",
        severity: "error",
      });
    }
  };
  const handleDeletePermission = async (permId) => {
    if (!window.confirm("Delete this permission?")) return;
    try {
      await api.delete(`/permissions/permissions/${permId}`);
      setSnackbar({
        open: true,
        message: "Permission deleted",
        severity: "success",
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to delete permission",
        severity: "error",
      });
    }
  };

  // --- Assignment Handlers ---
  const handleAssignPermissionToRole = async (roleId, permissionId) => {
    try {
      await api.post(
        `/permissions/roles/${roleId}/permissions/${permissionId}`,
      );
      setSnackbar({
        open: true,
        message: "Permission assigned to role",
        severity: "success",
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to assign permission",
        severity: "error",
      });
    }
  };
  const handleRevokePermissionFromRole = async (roleId, permissionId) => {
    try {
      await api.delete(
        `/permissions/roles/${roleId}/permissions/${permissionId}`,
      );
      setSnackbar({
        open: true,
        message: "Permission revoked from role",
        severity: "success",
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to revoke permission",
        severity: "error",
      });
    }
  };
  const handleAssignRoleToUser = async (userId, roleId) => {
    try {
      await api.post(`/permissions/users/${userId}/roles/${roleId}`);
      setSnackbar({
        open: true,
        message: "Role assigned to user",
        severity: "success",
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to assign role",
        severity: "error",
      });
    }
  };
  const handleRevokeRoleFromUser = async (userId, roleId) => {
    try {
      await api.delete(`/permissions/users/${userId}/roles/${roleId}`);
      setSnackbar({
        open: true,
        message: "Role revoked from user",
        severity: "success",
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to revoke role",
        severity: "error",
      });
    }
  };
  const handleAssignPermissionToUser = async (userId, permissionId) => {
    try {
      await api.post(
        `/permissions/users/${userId}/permissions/${permissionId}`,
      );
      setSnackbar({
        open: true,
        message: "Permission assigned to user",
        severity: "success",
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to assign permission",
        severity: "error",
      });
    }
  };
  const handleRevokePermissionFromUser = async (userId, permissionId) => {
    try {
      await api.delete(
        `/permissions/users/${userId}/permissions/${permissionId}`,
      );
      setSnackbar({
        open: true,
        message: "Permission revoked from user",
        severity: "success",
      });
      loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to revoke permission",
        severity: "error",
      });
    }
  };

  if (!isSuperAdmin && currentUser?.role !== "SUPER_ADMIN") {
    return (
      <Alert severity="error">
        You do not have permission to access this page.
      </Alert>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        Roles & Permissions Management
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Roles</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleOpenRoleDialog()}
              >
                Add Role
              </Button>
            </Box>
            <DataGrid
              autoHeight
              rows={roles}
              columns={[
                { field: "name", headerName: "Role", flex: 1 },
                { field: "description", headerName: "Description", flex: 2 },
                {
                  field: "actions",
                  headerName: "Actions",
                  renderCell: (params) => (
                    <>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenRoleDialog(params.row)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteRole(params.row.id)}
                      >
                        Delete
                      </Button>
                    </>
                  ),
                  flex: 1,
                },
              ]}
              getRowId={(row) => row.id}
              disableSelectionOnClick
              pageSize={5}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Permissions</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleOpenPermissionDialog()}
              >
                Add Permission
              </Button>
            </Box>
            <DataGrid
              autoHeight
              rows={permissions}
              columns={[
                { field: "module", headerName: "Module", flex: 1 },
                { field: "action", headerName: "Action", flex: 1 },
                { field: "description", headerName: "Description", flex: 2 },
                {
                  field: "actions",
                  headerName: "Actions",
                  renderCell: (params) => (
                    <>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenPermissionDialog(params.row)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeletePermission(params.row.id)}
                      >
                        Delete
                      </Button>
                    </>
                  ),
                  flex: 1,
                },
              ]}
              getRowId={(row) => row.id}
              disableSelectionOnClick
              pageSize={5}
            />
          </Paper>
        </Grid>
      </Grid>
      {/* TODO: Add tables for role-permission assignments, user-role assignments, and user-permission grants */}
      {/* TODO: Add dialogs for assigning/revoking permissions and roles */}
      {/* TODO: Add audit log display for permission/role changes */}
      {/* --- Role Dialog --- */}
      <Dialog
        open={openRoleDialog}
        onClose={handleCloseRoleDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Role Name"
            value={roleForm.name}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={roleForm.description}
            onChange={(e) =>
              setRoleForm({ ...roleForm, description: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>Cancel</Button>
          <Button onClick={handleSaveRole} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- Permission Dialog --- */}
      <Dialog
        open={openPermissionDialog}
        onClose={handleClosePermissionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingPermission ? "Edit Permission" : "Add Permission"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Module"
            value={permissionForm.module}
            onChange={(e) =>
              setPermissionForm({ ...permissionForm, module: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Action"
            value={permissionForm.action}
            onChange={(e) =>
              setPermissionForm({ ...permissionForm, action: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={permissionForm.description}
            onChange={(e) =>
              setPermissionForm({
                ...permissionForm,
                description: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissionDialog}>Cancel</Button>
          <Button onClick={handleSavePermission} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export { RolesAndPermissionsPage };
// TODO: Add advanced features: bulk assignment, search/filter, audit log display, etc.
// TODO: Add tests for all actions.
// TODO: Add loading spinners for async actions.
// TODO: Add error boundary.
// TODO: Add documentation link.
