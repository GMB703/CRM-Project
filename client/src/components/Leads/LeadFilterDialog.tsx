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
  Typography,
  Slider,
  Box,
} from '@mui/material';
import { LeadFilter, LeadStage } from '../../services/leadService';

interface LeadFilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (filter: LeadFilter) => void;
  currentFilter: LeadFilter;
  stages: LeadStage[];
}

const LeadFilterDialog = () => {
  const [filter, setFilter] = useState<LeadFilter>(currentFilter);

  const handleInputChange = (field: keyof LeadFilter) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilter({
      ...filter,
      [field]: event.target.value,
    });
  };

  const handleSliderChange = (field: keyof LeadFilter) => (
    _: Event,
    value: number | number[]
  ) => {
    if (typeof value === 'number') {
      setFilter({
        ...filter,
        [field]: value,
      });
    }
  };

  const handleApply = () => {
    onApply(filter);
  };

  const handleClear = () => {
    setFilter({});
    onApply({});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Filter Leads</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Search"
            value={filter.search || ''}
            onChange={handleInputChange('search')}
            fullWidth
            placeholder="Search by name, email, or company"
          />

          <TextField
            select
            label="Stage"
            value={filter.stage || ''}
            onChange={handleInputChange('stage')}
            fullWidth
          >
            <MenuItem value="">All Stages</MenuItem>
            {stages.map((stage) => (
              <MenuItem key={stage.id} value={stage.name}>
                {stage.name}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Typography gutterBottom>Lead Score Range</Typography>
            <Slider
              value={[
                filter.minLeadScore || 0,
                filter.maxLeadScore || 100,
              ]}
              onChange={(_, value) => {
                if (Array.isArray(value)) {
                  setFilter({
                    ...filter,
                    minLeadScore: value[0],
                    maxLeadScore: value[1],
                  });
                }
              }}
              valueLabelDisplay="auto"
              min={0}
              max={100}
            />
          </Box>

          <Box>
            <Typography gutterBottom>Estimated Value Range ($)</Typography>
            <Slider
              value={[
                filter.minEstimatedValue || 0,
                filter.maxEstimatedValue || 100000,
              ]}
              onChange={(_, value) => {
                if (Array.isArray(value)) {
                  setFilter({
                    ...filter,
                    minEstimatedValue: value[0],
                    maxEstimatedValue: value[1],
                  });
                }
              }}
              valueLabelDisplay="auto"
              min={0}
              max={100000}
              step={1000}
            />
          </Box>

          <TextField
            select
            label="Source"
            value={filter.source || ''}
            onChange={handleInputChange('source')}
            fullWidth
          >
            <MenuItem value="">All Sources</MenuItem>
            <MenuItem value="WEBSITE">Website</MenuItem>
            <MenuItem value="REFERRAL">Referral</MenuItem>
            <MenuItem value="SOCIAL">Social Media</MenuItem>
            <MenuItem value="EMAIL">Email Campaign</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </TextField>

          <TextField
            type="date"
            label="Start Date"
            value={filter.startDate || ''}
            onChange={handleInputChange('startDate')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            type="date"
            label="End Date"
            value={filter.endDate || ''}
            onChange={handleInputChange('endDate')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear}>Clear</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadFilterDialog; 