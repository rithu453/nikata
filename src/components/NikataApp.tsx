'use client';

import { useState, useEffect } from 'react';
import Terminal from './Terminal';
import Avatar from './Avatar';
import { AvatarState } from '@/lib/avatarStates';
import { getSoundController } from '@/lib/sound';

// Password for agent mode access
const AGENT_PASSWORD = 'NIKATA1987';

/**
 * NIKATA APP
 * The AI chatbot application - main feature of the OS.
 */
export default function NikataApp() {
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [browserMode, setBrowserMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Check for stored username on mount
  useEffect(() => {
    const storedName = localStorage.getItem('nikata_username');
    if (storedName) {
      setUserName(storedName);
    } else {
      setShowNamePrompt(true);
    }
  }, []);

  const handleAgentToggle = () => {
    if (browserMode) {
      // Turning off doesn't need password
      setBrowserMode(false);
    } else {
      // Turning on needs password
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.toUpperCase() === AGENT_PASSWORD) {
      setBrowserMode(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError(false);
      getSoundController().playStartup();
    } else {
      setPasswordError(true);
      getSoundController().playError();
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      const name = nameInput.trim().toUpperCase();
      localStorage.setItem('nikata_username', name);
      setUserName(name);
      setShowNamePrompt(false);
      getSoundController().playStartup();
    }
  };

  // Name prompt modal
  if (showNamePrompt) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
      }}>
        <div className="pixel-border" style={{
          padding: '24px',
          backgroundColor: '#0d0d0d',
          minWidth: '300px',
        }}>
          <div style={{ 
            marginBottom: '16px', 
            color: 'var(--terminal-green)',
            fontSize: '14px',
          }}>
            ╔════════════════════════╗
          </div>
          <div style={{ 
            marginBottom: '8px',
            color: 'var(--terminal-amber)',
            textAlign: 'center',
          }}>
            USER IDENTIFICATION
          </div>
          <div style={{ 
            marginBottom: '16px', 
            color: 'var(--terminal-green)',
            fontSize: '14px',
          }}>
            ╚════════════════════════╝
          </div>
          <div style={{ marginBottom: '12px', color: '#888888', fontSize: '14px' }}>
            ENTER YOUR NAME TO CONTINUE:
          </div>
          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
              className="terminal-input"
              style={{
                border: '1px solid var(--terminal-border)',
                padding: '8px',
                marginBottom: '12px',
                display: 'block',
                width: '100%',
                backgroundColor: '#000000',
              }}
              placeholder="YOUR NAME..."
            />
            <button
              type="submit"
              className="pixel-border"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1a1a1a',
                color: 'var(--terminal-green)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              [ CONFIRM IDENTITY ]
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#0a0a0a',
    }}>
      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="pixel-border" style={{
            padding: '24px',
            backgroundColor: '#0d0d0d',
            minWidth: '280px',
          }}>
            <div style={{ 
              marginBottom: '12px',
              color: 'var(--terminal-amber)',
              textAlign: 'center',
            }}>
              ⚠ RESTRICTED ACCESS ⚠
            </div>
            <div style={{ marginBottom: '12px', color: '#888888', fontSize: '12px' }}>
              WEB AGENT REQUIRES AUTHORIZATION.
              <br />ENTER ACCESS CODE:
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                autoFocus
                className="terminal-input"
                style={{
                  border: `1px solid ${passwordError ? '#ff3333' : 'var(--terminal-border)'}`,
                  padding: '8px',
                  marginBottom: '8px',
                  display: 'block',
                  width: '100%',
                  backgroundColor: '#000000',
                }}
                placeholder="********"
              />
              {passwordError && (
                <div style={{ color: '#ff3333', fontSize: '10px', marginBottom: '8px' }}>
                  ACCESS DENIED. INVALID CODE.
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className="pixel-border"
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: '#1a3a1a',
                    color: 'var(--terminal-green)',
                    cursor: 'pointer',
                    fontSize: '10px',
                  }}
                >
                  [ SUBMIT ]
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="pixel-border"
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: '#3a1a1a',
                    color: '#ff6666',
                    cursor: 'pointer',
                    fontSize: '10px',
                  }}
                >
                  [ CANCEL ]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEFT PANEL - AVATAR */}
      <aside style={{
        width: '100px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <Avatar state={avatarState} />

        {/* USER INFO */}
        <div
          className="pixel-border"
          style={{
            padding: '6px',
            fontSize: '9px',
            backgroundColor: '#0a0a0a',
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#666666', marginBottom: '2px' }}>USER</div>
          <div style={{ color: 'var(--terminal-amber)' }}>{userName}</div>
        </div>

        {/* BROWSER MODE TOGGLE */}
        <button
          onClick={handleAgentToggle}
          className="pixel-border"
          style={{
            padding: '8px 4px',
            fontSize: '9px',
            backgroundColor: browserMode ? '#1a3a1a' : '#1a1a1a',
            color: browserMode ? 'var(--terminal-green)' : '#666666',
            border: browserMode ? '2px solid var(--terminal-green)' : '2px solid var(--terminal-border)',
            cursor: 'pointer',
            textAlign: 'center',
            letterSpacing: '1px',
            transition: 'none',
          }}
        >
          <div style={{ marginBottom: '4px' }}>
            {browserMode ? '[ ON ]' : '[ OFF ]'}
          </div>
          <div style={{ 
            color: browserMode ? 'var(--terminal-green)' : '#444444',
            fontSize: '8px',
          }}>
            WEB AGENT
          </div>
          <div style={{ 
            fontSize: '7px', 
            color: '#ff6666',
            marginTop: '2px',
          }}>
            🔒 LOCKED
          </div>
          <div style={{
            marginTop: '4px',
            width: '100%',
            height: '4px',
            backgroundColor: browserMode ? 'var(--terminal-green)' : '#333333',
            boxShadow: browserMode ? '0 0 6px var(--terminal-green)' : 'none',
          }} />
        </button>

        {/* SYSTEM INFO */}
        <div
          className="pixel-border"
          style={{
            padding: '6px',
            fontSize: '9px',
            backgroundColor: '#0a0a0a',
          }}
        >
          <div style={{ color: '#666666', marginBottom: '2px' }}>
            SYS INFO
          </div>
          <div>MEM: 640K</div>
          <div>CPU: 4.77MHZ</div>
          <div>AI: ACTIVE</div>
          <div style={{ 
            color: browserMode ? 'var(--terminal-green)' : '#333333',
            marginTop: '2px',
          }}>
            WEB: {browserMode ? 'ON' : 'OFF'}
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL - TERMINAL */}
      <div
        className="pixel-border"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Terminal onStateChange={setAvatarState} browserMode={browserMode} userName={userName} />
      </div>
    </div>
  );
}
