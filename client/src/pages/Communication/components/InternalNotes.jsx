import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const InternalNotes = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const user = useSelector((state) => state.auth.user);
  const currentProject = useSelector((state) => state.projects.currentProject);

  useEffect(() => {
    if (currentProject) {
      fetchNotes();
    }
  }, [currentProject]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/communications/notes/${currentProject.id}`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const response = await fetch('/api/communications/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote,
          projectId: currentProject.id,
        }),
      });

      if (response.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleEdit = async (noteId, content) => {
    try {
      const response = await fetch(`/api/communications/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setEditingNote(null);
        fetchNotes();
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/communications/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (!currentProject) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Please select a project to view notes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-8">
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            New Note
          </label>
          <textarea
            id="note"
            rows={4}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Add a new note..."
            required
          />
        </div>
        <div className="mt-4">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Note
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-white shadow rounded-lg p-4">
            {editingNote === note.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEdit(note.id, e.target.content.value);
                }}
                className="space-y-4"
              >
                <textarea
                  name="content"
                  defaultValue={note.content}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingNote(null)}
                    className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-gray-900">{note.content}</p>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    By {note.user?.name} on{' '}
                    {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                  {note.userId === user.id && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingNote(note.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternalNotes; 