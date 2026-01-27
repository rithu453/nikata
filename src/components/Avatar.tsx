'use client';

import { useMemo } from 'react';
import { AvatarState, getAvatarExpression } from '@/lib/avatarStates';

interface AvatarProps {
  state: AvatarState;
}

/**
 * AVATAR COMPONENT
 * Renders pixel-art face based on current state.
 * No smooth animations - instant state switches only.
 */
export default function Avatar({ state }: AvatarProps) {
  const expression = getAvatarExpression(state);

  const pixelGrid = useMemo(() => {
    const lines = expression.pixels.split('\n');
    return lines.map((line, y) => (
      <div key={y} style={{ display: 'flex' }}>
        {line.split('').map((char, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: char === '#' ? 'var(--terminal-green)' : 'transparent',
              boxShadow: char === '#' ? '0 0 2px var(--terminal-green)' : 'none',
            }}
          />
        ))}
      </div>
    ));
  }, [expression.pixels]);

  // Determine animation class based on state
  const animationClass = state === 'thinking' ? 'robot-thinking' :
                         state === 'responding' ? 'robot-responding' :
                         'robot-animate';

  return (
    <div className="pixel-border" style={{
      padding: '12px',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}>
      {/* AVATAR FRAME */}
      <div 
        className={animationClass}
        style={{
          border: '1px solid var(--terminal-border)',
          padding: '4px',
          backgroundColor: '#000000',
        }}
      >
        {pixelGrid}
      </div>

      {/* STATE INDICATOR */}
      <div style={{
        fontSize: '12px',
        letterSpacing: '2px',
        color: state === 'error' ? '#ff3333' : 'var(--terminal-green)',
      }}>
        [{expression.label}]
      </div>

      {/* STATUS LED */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '10px',
      }}>
        <div
          className={state === 'thinking' || state === 'responding' ? 'cursor-blink' : ''}
          style={{
            width: '8px',
            height: '8px',
            backgroundColor: state === 'error' ? '#ff3333' :
              state === 'idle' ? '#333333' : 'var(--terminal-green)',
            boxShadow: state !== 'idle' && state !== 'error' ?
              '0 0 4px var(--terminal-green)' : 'none',
          }}
        />
        <span style={{ color: '#666666' }}>PWR</span>
      </div>
    </div>
  );
}
