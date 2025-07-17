import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Event as EventIcon,
  Note as NoteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { leadService, LeadActivity, LeadActivityType } from '../../services/leadService';

interface LeadActivitiesProps {
  leadId: string;
}

const activityTypeIcons: Record<LeadActivityType, React.ReactElement> = {
  CALL: <PhoneIcon />,
  EMAIL: <EmailIcon />,
  MEETING: <EventIcon />,
  NOTE: <NoteIcon />,
  STAGE_CHANGE: <EditIcon />,
  DEMO: <EventIcon />,
  QUOTE_SENT: <EmailIcon />,
  FOLLOW_UP: <EventIcon />,
  CONVERSION: <EditIcon />,
  OTHER: <NoteIcon />,
};

const LeadActivities = () => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<LeadActivity>>({
    type: 'NOTE',
    title: '',
    description: '',
  });

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await leadService.getLeadActivities(leadId);
      setActivities(response);
    } catch (err) {
      setError('Failed to load activities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const handleAddActivity = async () => {
    try {
      await leadService.createLeadActivity(leadId, newActivity);
      await loadActivities();
      setShowAddDialog(false);
      setNewActivity({
        type: 'NOTE',
        title: '',
        description: '',
      });
    } catch (err) {
      setError('Failed to create activity');
      console.error(err);
    }
  };

  const handleInputChange = (field: keyof LeadActivity) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewActivity({
      ...newActivity,
      [field]: event.target.value,
    });
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography>Loading activities...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Activities</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Activity
        </Button>
      </Box>

      <List>
        {activities.map((activity) => (
          <ListItem
            key={activity.id}
            divider
            secondaryAction={
              <Stack direction="row" spacing={1}>
                {activity.scheduledAt && (
                  <Chip
                    size="small"
                    label={format(new Date(activity.scheduledAt), 'PPp')}
                    color={
                      new Date(activity.scheduledAt) > new Date()
                        ? 'primary'
                        : 'default'
                    }
                  />
                )}
                {activity.completedAt && (
                  <Chip
                    size="small"
                    label="Completed"
                    color="success"
                  />
                )}
              </Stack>
            }
          >
            <ListItemIcon>{activityTypeIcons[activity.type]}</ListItemIcon>
            <ListItemText
              primary={activity.title}
              secondary={
                <>
                  <Typography variant="body2" color="textSecondary">
                    {activity.description}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(activity.createdAt), 'PPp')}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
        {activities.length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <Typography color="textSecondary" align="center">
                  No activities yet
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>

      {/* Add Activity Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogTitle>Add Activity</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Type"
              value={newActivity.type}
              onChange={handleInputChange('type')}
              fullWidth
            >
              {Object.values(LeadActivityType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Title"
              value={newActivity.title}
              onChange={handleInputChange('title')}
              fullWidth
            />
            <TextField
              label="Description"
              value={newActivity.description}
              onChange={handleInputChange('description')}
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              label="Scheduled At"
              type="datetime-local"
              value={newActivity.scheduledAt}
              onChange={handleInputChange('scheduledAt')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddActivity}
            variant="contained"
            color="primary"
            disabled={!newActivity.title || !newActivity.type}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export { LeadActivities }; 