import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
} from "@mui/material";
import { api } from "../../services/api";

const PAGE_SIZE = 20;

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE);
  const [filters, setFilters] = useState({
    userId: "",
    organizationId: "",
    action: "",
    targetType: "",
    startDate: "",
    endDate: "",
  });
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...filters,
        skip: page * rowsPerPage,
        take: rowsPerPage,
      };
      const response = await api.get("/admin/audit-logs", { params });
      setLogs(response.data.data || []);
      // Optionally, setTotal(response.data.total) if backend supports it
    } catch (err) {
      setError("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [page, rowsPerPage]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchLogs();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Audit Log
      </Typography>
      <Card className="mb-4 p-4">
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="User ID"
            name="userId"
            value={filters.userId}
            onChange={handleFilterChange}
            size="small"
          />
          <TextField
            label="Organization ID"
            name="organizationId"
            value={filters.organizationId}
            onChange={handleFilterChange}
            size="small"
          />
          <TextField
            label="Action"
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            size="small"
          />
          <TextField
            label="Target Type"
            name="targetType"
            value={filters.targetType}
            onChange={handleFilterChange}
            size="small"
          />
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilters}
            disabled={loading}
          >
            Apply Filters
          </Button>
        </Box>
      </Card>
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>User Agent</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    style={{ color: "red" }}
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.user
                        ? `${log.user.firstName || ""} ${log.user.lastName || ""} (${log.user.email})`
                        : log.userId}
                    </TableCell>
                    <TableCell>
                      {log.organization
                        ? log.organization.name
                        : log.organizationId}
                    </TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small" />
                    </TableCell>
                    <TableCell>
                      {log.targetType} {log.targetId}
                    </TableCell>
                    <TableCell>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          margin: 0,
                        }}
                      >
                        {log.details
                          ? JSON.stringify(log.details, null, 2)
                          : ""}
                      </pre>
                    </TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell
                      style={{
                        maxWidth: 120,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {log.userAgent}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={
            total ||
            (page + 1) * rowsPerPage +
              (logs.length === rowsPerPage ? rowsPerPage : 0)
          }
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export { AuditLogViewer };
