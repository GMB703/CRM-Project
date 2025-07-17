import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Chip,
  Box,
  Pagination,
  CircularProgress,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { Lead } from '../../services/leadService';

interface LeadListProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onLeadSelect: (lead: Lead) => void;
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const LeadList = () => {
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (leads.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">No leads found</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <List disablePadding>
        {leads.map((lead) => (
          <ListItem
            key={lead.id}
            disablePadding
            divider
            selected={selectedLead?.id === lead.id}
          >
            <ListItemButton onClick={() => onLeadSelect(lead)}>
              <ListItemText
                primary={
                  <Typography variant="subtitle1">
                    {lead.firstName} {lead.lastName}
                  </Typography>
                }
                secondary={
                  <Stack spacing={1}>
                    <Typography variant="body2" color="textSecondary">
                      {lead.company || 'No company'}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Chip
                        size="small"
                        label={lead.stage}
                        color={
                          lead.stage === 'CLOSED_WON'
                            ? 'success'
                            : lead.stage === 'CLOSED_LOST'
                            ? 'error'
                            : 'default'
                        }
                      />
                      {lead.leadScore && (
                        <Chip
                          size="small"
                          label={`Score: ${lead.leadScore}`}
                          color={
                            lead.leadScore >= 80
                              ? 'success'
                              : lead.leadScore >= 50
                              ? 'warning'
                              : 'default'
                          }
                        />
                      )}
                    </Box>
                  </Stack>
                }
              />
              <ListItemSecondaryAction>
                <Typography variant="caption" color="textSecondary">
                  {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                </Typography>
              </ListItemSecondaryAction>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {totalPages > 1 && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      )}
    </Paper>
  );
};

export { LeadList }; 