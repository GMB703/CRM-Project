import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { leadService, LeadActivity, LeadActivityType } from '../../services/leadService';

interface LeadNotesProps {
  leadId: string;
}

const LeadNotes = () => {
  const [notes, setNotes] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    description: '',
  });

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await leadService.getLeadActivities(leadId);
      setNotes(response.filter((activity) => activity.type === LeadActivityType.NOTE));
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [leadId]);

  const handleAddNote = async () => {
    try {
      await leadService.createLeadActivity(leadId, {
        type: LeadActivityType.NOTE,
        title: newNote.title,
        description: newNote.description,
      });
      await loadNotes();
      setShowAddDialog(false);
      setNewNote({ title: '', description: '' });
    } catch (err) {
      setError('Failed to create note');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography>Loading notes...</Typography>
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
        <Typography variant="h6">Notes</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Note
        </Button>
      </Box>

      <List>
        {notes.map((note) => (
          <ListItem key={note.id} divider>
            <ListItemText
              primary={note.title}
              secondary={
                <>
                  <Typography variant="body2" color="textSecondary">
                    {note.description}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(note.createdAt), 'PPp')}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
        {notes.length === 0 && (
          <ListItem>
            <ListItemText
              primary={
                <Typography color="textSecondary" align="center">
                  No notes yet
                </Typography>
              }
            />
          </ListItem>
        )}
      </List>

      {/* Add Note Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)}>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={newNote.description}
              onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddNote}
            variant="contained"
            color="primary"
            disabled={!newNote.title}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export { LeadNotes }; 