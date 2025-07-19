import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Spinner } from "../../UI/Spinner";
import {
  getAllOrganizationsAdmin,
  deleteOrganizationAdmin,
  createOrganizationAdmin,
  updateOrganizationAdmin,
} from "../../../services/organizationAPI";
import { toast } from "react-hot-toast";

const OrganizationsPage = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [editingOrgId, setEditingOrgId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch organizations
  const { data, isLoading, error } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const response = await getAllOrganizationsAdmin();
      return response.data.data;
    },
  });

  // Delete organization mutation
  const deleteMutation = useMutation({
    mutationFn: deleteOrganizationAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(["organizations"]);
      toast.success("Organization deleted successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Failed to delete organization",
      );
    },
  });

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: createOrganizationAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries(["organizations"]);
      toast.success("Organization created successfully");
      setOpenDialog(false);
      setFormData({ name: "", code: "" });
      setFormError("");
    },
    onError: (error) => {
      setFormError(
        error.response?.data?.error || "Failed to create organization",
      );
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (org) => {
    setEditMode(true);
    setEditingOrgId(org.id);
    setFormData({ name: org.name, code: org.code });
    setFormError("");
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditMode(false);
    setEditingOrgId(null);
    setFormData({ name: "", code: "" });
    setFormError("");
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      if (!formData.name.trim() || !formData.code.trim()) {
        setFormError("Name and code are required.");
        setSubmitting(false);
        return;
      }
      if (editMode && editingOrgId) {
        await updateOrganizationAdmin(editingOrgId, formData);
      } else {
        await createOrganizationAdmin(formData);
      }
      handleDialogClose();
      queryClient.invalidateQueries(["organizations"]);
    } catch (err) {
      setFormError(err?.response?.data?.error || "Failed to save organization");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error: {error.response?.data?.error || "Failed to load organizations"}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setEditMode(false);
            setEditingOrgId(null);
            setFormData({ name: "", code: "" });
            setFormError("");
            setOpenDialog(true);
          }}
        >
          Add Organization
        </Button>
      </div>

      <Paper className="overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((org) => (
              <TableRow key={org.id}>
                <TableCell>{org.name}</TableCell>
                <TableCell>{org.code}</TableCell>
                <TableCell>{org.users?.length || 0}</TableCell>
                <TableCell>
                  {new Date(org.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEdit(org)}
                    size="small"
                    aria-label="edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(org.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Add/Edit Organization Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
          {editMode ? "Edit Organization" : "Add Organization"}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleFormSubmit} id="org-form">
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Organization Name"
              type="text"
              fullWidth
              value={formData.name}
              onChange={handleFormChange}
              required
            />
            <TextField
              margin="dense"
              name="code"
              label="Organization Code"
              type="text"
              fullWidth
              value={formData.code}
              onChange={handleFormChange}
              required
            />
            {formError && (
              <Typography color="error" variant="body2" className="mt-2">
                {formError}
              </Typography>
            )}
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="org-form"
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {editMode ? "Save Changes" : "Add Organization"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export { OrganizationsPage };
