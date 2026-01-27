'use client';

import { useState, useEffect } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * NOTES APP
 * Simple text notes with localStorage persistence.
 */

interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: number;
}

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nikata_notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load notes:', e);
      }
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('nikata_notes', JSON.stringify(notes));
  }, [notes]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: `NOTE_${new Date().toISOString().split('T')[0]}`,
      content: '',
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setEditContent('');
    getSoundController().playStartup();
  };

  const selectNote = (note: Note) => {
    // Save current note before switching
    if (selectedNote && editContent !== selectedNote.content) {
      saveNote();
    }
    setSelectedNote(note);
    setEditContent(note.content);
    getSoundController().playUserKeyClick();
  };

  const saveNote = () => {
    if (!selectedNote) return;
    
    setNotes(notes.map(n =>
      n.id === selectedNote.id
        ? { ...n, content: editContent, updatedAt: Date.now() }
        : n
    ));
    getSoundController().playAIKeyClick();
  };

  const deleteNote = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setEditContent('');
    }
    getSoundController().playError();
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      backgroundColor: '#0a0a0a',
    }}>
      {/* NOTES LIST */}
      <div style={{
        width: '180px',
        borderRight: '1px solid var(--terminal-border)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '8px',
          borderBottom: '1px solid var(--terminal-border)',
          backgroundColor: '#1a1a1a',
        }}>
          <button
            onClick={createNote}
            style={{
              width: '100%',
              background: 'none',
              border: '1px solid var(--terminal-green)',
              color: 'var(--terminal-green)',
              padding: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            [+ NEW NOTE]
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notes.length === 0 ? (
            <div style={{ color: '#666666', padding: '12px', fontSize: '12px', textAlign: 'center' }}>
              NO NOTES
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                style={{
                  padding: '8px',
                  borderBottom: '1px solid #1a1a1a',
                  cursor: 'pointer',
                  backgroundColor: selectedNote?.id === note.id ? '#1a2a1a' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: selectedNote?.id === note.id ? 'var(--terminal-green)' : '#888888',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {note.title}
                  </div>
                  <div style={{ color: '#555555', fontSize: '10px' }}>
                    {formatDate(note.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => deleteNote(note.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff3333',
                    cursor: 'pointer',
                    fontSize: '10px',
                    padding: '2px',
                  }}
                >
                  X
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EDITOR */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {selectedNote ? (
          <>
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--terminal-border)',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: 'var(--terminal-amber)' }}>{selectedNote.title}</span>
              <button
                onClick={saveNote}
                style={{
                  background: 'none',
                  border: '1px solid var(--terminal-green)',
                  color: 'var(--terminal-green)',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                [SAVE]
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: '#0a0a0a',
                color: 'var(--terminal-green)',
                border: 'none',
                padding: '12px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'none',
                outline: 'none',
              }}
              placeholder="TYPE YOUR NOTES HERE..."
            />
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666666',
          }}>
            SELECT OR CREATE A NOTE
          </div>
        )}
      </div>
    </div>
  );
}
