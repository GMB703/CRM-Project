import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DocumentTextIcon, TagIcon, PlusIcon } from '@heroicons/react/24/outline';

const InternalNotes = () => {
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: 'Project Planning Meeting',
      content: 'Discussed timeline and resource allocation for the kitchen renovation project. Client wants to expedite the delivery.',
      tags: ['meeting', 'planning', 'urgent'],
      author: 'John Smith',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      title: 'Client Follow-up',
      content: 'Called client about material selections. They prefer oak cabinets over maple. Need to update estimate.',
      tags: ['follow-up', 'materials'],
      author: 'Jane Johnson',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ]);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

  const user = useSelector((state) => state.auth?.user);
  const currentOrganization = useSelector((state) => state.organization?.currentOrganization);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.title || !newNote.content) return;

    const noteData = {
      id: Date.now(),
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags,
      author: user?.name || 'Demo User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes(prev => [noteData, ...prev]);
    setNewNote({ title: '', content: '', tags: [] });
    setTagInput('');
    setShowForm(false);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !newNote.tags.includes(tagInput.trim().toLowerCase())) {
      setNewNote(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredNotes = notes.filter(note =>
    filter === '' || 
    note.title.toLowerCase().includes(filter.toLowerCase()) ||
    note.content.toLowerCase().includes(filter.toLowerCase()) ||
    note.tags.some(tag => tag.includes(filter.toLowerCase())) ||
    note.author.toLowerCase().includes(filter.toLowerCase())
  );

  const allTags = [...new Set(notes.flatMap(note => note.tags))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Internal Notes</h3>
          <p className="text-sm text-gray-600">
            Private notes and observations for team use only
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 inline mr-2" />
          Add Note
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search notes, tags, or authors..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 5).map(tag => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
            >
              <TagIcon className="h-3 w-3 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Note</h4>
          <form onSubmit={handleAddNote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Note title..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Note content..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Add tag and press Enter..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              {newNote.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {newNote.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter ? 'Try adjusting your search terms.' : 'Create your first internal note to get started.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-medium text-gray-900">{note.title}</h4>
                <div className="text-xs text-gray-500">
                  {new Date(note.createdAt).toLocaleDateString()} by {note.author}
                </div>
              </div>
              <p className="text-gray-700 mb-3">{note.content}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <DocumentTextIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-indigo-800">
              Notes Summary
            </h3>
            <p className="text-sm text-indigo-700 mt-1">
              {notes.length} total notes • {allTags.length} unique tags • Organization: {currentOrganization?.name || 'Demo Organization'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalNotes; 