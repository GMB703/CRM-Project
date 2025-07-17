import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Divider,
  TextField,
  MenuItem,
  IconButton,
  Tab,
  Tabs,
  Stack,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Lead, LeadStage } from '../../services/leadService';
import LeadActivities from './LeadActivities';
import LeadNotes from './LeadNotes';

interface LeadDetailProps {
  lead: Lead;
  onUpdate: (id: string, data: Partial<Lead>) => Promise<void>;
  stages: LeadStage[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const LeadDetail = () => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [activeTab, setActiveTab] = useState(0);

  const handleEditToggle = () => {
    if (editing) {
      setEditData({});
    } else {
      setEditData({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        stage: lead.stage,
        estimatedValue: lead.estimatedValue,
      });
    }
    setEditing(!editing);
  };

  const handleSave = async () => {
    await onUpdate(lead.id, editData);
    setEditing(false);
    setEditData({});
  };

  const handleInputChange = (field: keyof Lead) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditData({
      ...editData,
      [field]: event.target.value,
    });
  };

  return (
    <Paper>
      {/* Header */}
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2">
            Lead Details
          </Typography>
          <Box>
            {editing ? (
              <>
                <IconButton onClick={handleSave} color="primary">
                  <SaveIcon />
                </IconButton>
                <IconButton onClick={handleEditToggle} color="error">
                  <CancelIcon />
                </IconButton>
              </>
            ) : (
              <IconButton onClick={handleEditToggle} color="primary">
                <EditIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField
                label="First Name"
                value={editing ? editData.firstName : lead.firstName}
                onChange={handleInputChange('firstName')}
                disabled={!editing}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={editing ? editData.lastName : lead.lastName}
                onChange={handleInputChange('lastName')}
                disabled={!editing}
                fullWidth
              />
              <TextField
                label="Email"
                value={editing ? editData.email : lead.email}
                onChange={handleInputChange('email')}
                disabled={!editing}
                fullWidth
                InputProps={{
                  startAdornment: <EmailIcon color="action" />,
                }}
              />
              <TextField
                label="Phone"
                value={editing ? editData.phone : lead.phone || ''}
                onChange={handleInputChange('phone')}
                disabled={!editing}
                fullWidth
                InputProps={{
                  startAdornment: <PhoneIcon color="action" />,
                }}
              />
              <TextField
                label="Company"
                value={editing ? editData.company : lead.company || ''}
                onChange={handleInputChange('company')}
                disabled={!editing}
                fullWidth
                InputProps={{
                  startAdornment: <BusinessIcon color="action" />,
                }}
              />
            </Stack>
          </Grid>

          {/* Lead Status and Metrics */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField
                select
                label="Stage"
                value={editing ? editData.stage : lead.stage}
                onChange={handleInputChange('stage')}
                disabled={!editing}
                fullWidth
              >
                {stages.map((stage) => (
                  <MenuItem key={stage.id} value={stage.name}>
                    {stage.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Estimated Value"
                type="number"
                value={editing ? editData.estimatedValue : lead.estimatedValue || ''}
                onChange={handleInputChange('estimatedValue')}
                disabled={!editing}
                fullWidth
                InputProps={{
                  startAdornment: <Typography color="textSecondary">$</Typography>,
                }}
              />
              {lead.leadScore && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Lead Score
                  </Typography>
                  <Chip
                    label={`${lead.leadScore}`}
                    color={
                      lead.leadScore >= 80
                        ? 'success'
                        : lead.leadScore >= 50
                        ? 'warning'
                        : 'default'
                    }
                  />
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  Created: {format(new Date(lead.createdAt), 'PPP')}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  Last Updated: {format(new Date(lead.updatedAt), 'PPP')}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="lead details tabs"
        >
          <Tab label="Activities" />
          <Tab label="Notes" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <LeadActivities leadId={lead.id} />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <LeadNotes leadId={lead.id} />
      </TabPanel>
    </Paper>
  );
};

export { LeadDetail }; 