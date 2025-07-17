import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Grid,
} from '@mui/material';
import { Lead, LeadStage } from '../../services/leadService';

interface LeadCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Lead>) => Promise<void>;
  stages: LeadStage[];
}

const LeadCreateDialog = () => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    stage: stages[0]?.name || '',
    estimatedValue: undefined,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof Lead) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onCreate(formData);
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      source: '',
      stage: stages[0]?.name || '',
      estimatedValue: undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Lead</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
                fullWidth
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                fullWidth
              />
            </Stack>
          </Grid>

          {/* Company and Lead Information */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <TextField
                label="Company"
                value={formData.company}
                onChange={handleInputChange('company')}
                fullWidth
              />
              <TextField
                select
                label="Source"
                value={formData.source}
                onChange={handleInputChange('source')}
                required
                fullWidth
              >
                <MenuItem value="WEBSITE">Website</MenuItem>
                <MenuItem value="REFERRAL">Referral</MenuItem>
                <MenuItem value="SOCIAL">Social Media</MenuItem>
                <MenuItem value="EMAIL">Email Campaign</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
              <TextField
                select
                label="Stage"
                value={formData.stage}
                onChange={handleInputChange('stage')}
                required
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
                value={formData.estimatedValue || ''}
                onChange={handleInputChange('estimatedValue')}
                fullWidth
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { LeadCreateDialog }; 