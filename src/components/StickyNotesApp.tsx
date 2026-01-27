'use client';

import { useState, useEffect, useRef } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * STICKY NOTES APP
 * Colorful draggable sticky notes with localStorage persistence.
 */

interface StickyNote {
  id: number;
  content: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const COLORS = [
  { name: 'YELLOW', bg: '#ffff88', text: '#333300' },
  { name: 'GREEN', bg: '#88ff88', text: '#003300' },
  { name: 'PINK', bg: '#ff88ff', text: '#330033' },
  { name: 'BLUE', bg: '#88ffff', text: '#003333' },
  { name: 'ORANGE', bg: '#ffcc88', text: '#332200' },
];

export default function StickyNotesApp() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: number; startWidth: number; startHeight: number; startX: number; startY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nikata_sticky_notes');
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load sticky notes:', e);
      }
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('nikata_sticky_notes', JSON.stringify(notes));
  }, [notes]);

  const createNote = (colorIndex: number = 0) => {
    const color = COLORS[colorIndex];
    const newNote: StickyNote = {
      id: Date.now(),
      content: '',
      color: color.bg,
      x: 20 + Math.random() * 100,
      y: 20 + Math.random() * 100,
      width: 150,
      height: 150,
    };
    setNotes([...notes, newNote]);
    setSelectedNote(newNote.id);
    getSoundController().playStartup();
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote === id) setSelectedNote(null);
    getSoundController().playError();
  };

  const updateNoteContent = (id: number, content: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, content } : n));
  };

  const handleMouseDown = (e: React.MouseEvent, note: StickyNote) => {
    e.stopPropagation();
    setSelectedNote(note.id);
    
    const rect = (e.target as HTMLElement).closest('.sticky-note')?.getBoundingClientRect();
    if (rect) {
      setDragging({
        id: note.id,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      });
    }
    getSoundController().playUserKeyClick();
  };

  const handleResizeMouseDown = (e: React.MouseEvent, note: StickyNote) => {
    e.stopPropagation();
    setResizing({
      id: note.id,
      startWidth: note.width,
      startHeight: note.height,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(rect.width - 100, e.clientX - rect.left - dragging.offsetX));
      const newY = Math.max(0, Math.min(rect.height - 100, e.clientY - rect.top - dragging.offsetY));
      
      setNotes(notes.map(n => 
        n.id === dragging.id ? { ...n, x: newX, y: newY } : n
      ));
    }
    
    if (resizing) {
      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;
      const newWidth = Math.max(100, resizing.startWidth + deltaX);
      const newHeight = Math.max(80, resizing.startHeight + deltaY);
      
      setNotes(notes.map(n =>
        n.id === resizing.id ? { ...n, width: newWidth, height: newHeight } : n
      ));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const changeNoteColor = (id: number) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    const currentIndex = COLORS.findIndex(c => c.bg === note.color);
    const nextIndex = (currentIndex + 1) % COLORS.length;
    const nextColor = COLORS[nextIndex];
    
    setNotes(notes.map(n => n.id === id ? { ...n, color: nextColor.bg } : n));
    getSoundController().playAIKeyClick();
  };

  const getTextColor = (bgColor: string) => {
    const colorObj = COLORS.find(c => c.bg === bgColor);
    return colorObj?.text || '#333333';
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => setSelectedNote(null)}
      style={{
        height: '100%',
        backgroundColor: '#1a1a1a',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* TOOLBAR */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 12px',
        backgroundColor: '#0a0a0a',
        borderBottom: '1px solid var(--terminal-border)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        zIndex: 100,
      }}>
        <span style={{ color: 'var(--terminal-green)', fontSize: '12px', marginRight: '8px' }}>
          NEW:
        </span>
        {COLORS.map((color, idx) => (
          <button
            key={color.name}
            onClick={(e) => { e.stopPropagation(); createNote(idx); }}
            title={color.name}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: color.bg,
              border: '2px solid #333333',
              cursor: 'pointer',
            }}
          />
        ))}
        <span style={{ color: '#666666', fontSize: '11px', marginLeft: 'auto' }}>
          {notes.length} NOTE{notes.length !== 1 ? 'S' : ''} | DRAG TO MOVE
        </span>
      </div>

      {/* NOTES AREA */}
      <div style={{
        position: 'absolute',
        top: '42px',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle, #252525 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}>
        {notes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#444444',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>NO STICKY NOTES</div>
            <div style={{ fontSize: '12px' }}>CLICK A COLOR ABOVE TO CREATE ONE</div>
          </div>
        )}

        {notes.map(note => (
          <div
            key={note.id}
            className="sticky-note"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: note.x,
              top: note.y,
              width: note.width,
              height: note.height,
              backgroundColor: note.color,
              boxShadow: selectedNote === note.id 
                ? '4px 4px 0 #000000, 0 0 0 2px var(--terminal-green)'
                : '4px 4px 0 #000000',
              display: 'flex',
              flexDirection: 'column',
              cursor: dragging?.id === note.id ? 'grabbing' : 'grab',
              zIndex: selectedNote === note.id ? 50 : 10,
            }}
          >
            {/* NOTE HEADER */}
            <div
              onMouseDown={(e) => handleMouseDown(e, note)}
              style={{
                padding: '4px 6px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'grab',
              }}
            >
              <button
                onClick={() => changeNoteColor(note.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: getTextColor(note.color),
                  cursor: 'pointer',
                  fontSize: '10px',
                  padding: '2px 4px',
                }}
                title="CHANGE COLOR"
              >
                ◐
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cc0000',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: '2px 4px',
                }}
                title="DELETE"
              >
                ×
              </button>
            </div>

            {/* NOTE CONTENT */}
            <textarea
              value={note.content}
              onChange={(e) => updateNoteContent(note.id, e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Type here..."
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                padding: '8px',
                color: getTextColor(note.color),
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'none',
                outline: 'none',
                lineHeight: '1.4',
              }}
            />

            {/* RESIZE HANDLE */}
            <div
              onMouseDown={(e) => handleResizeMouseDown(e, note)}
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: '16px',
                height: '16px',
                cursor: 'nwse-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getTextColor(note.color),
                fontSize: '10px',
                opacity: 0.5,
              }}
            >
              ⋱
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
