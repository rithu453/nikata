'use client';

import { ReactNode } from 'react';
import { getSoundController } from '@/lib/sound';

interface WindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  isMaximized?: boolean;
  width?: string;
  height?: string;
}

export default function Window({ title, onClose, children, isMaximized = false, width = '800px', height = '600px' }: WindowProps) {
  const sound = getSoundController();

  const handleClose = () => {
    sound.playWindowClose();
    onClose();
  };

  return (
    <div
      className="pixel-border"
      style={{
        position: 'absolute',
        top: isMaximized ? '0' : '50%',
        left: isMaximized ? '0' : '50%',
        transform: isMaximized ? 'none' : 'translate(-50%, -50%)',
        width: isMaximized ? '100%' : width,
        height: isMaximized ? '100%' : height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        zIndex: 100,
      }}
    >
      {/* WINDOW TITLE BAR */}
      <div style={{
        padding: '6px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderBottom: '2px solid var(--terminal-border)',
      }}>
        <span className="text-glow" style={{ fontSize: '14px' }}>{title}</span>
        <button
          onClick={handleClose}
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#333333',
            border: '2px solid #444444',
            color: '#ff3333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit',
            fontSize: '12px',
            padding: 0,
          }}
        >
          X
        </button>
      </div>

      {/* WINDOW CONTENT */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}
