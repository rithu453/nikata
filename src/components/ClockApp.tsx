'use client';

import { useState, useEffect, useRef } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * CLOCK / TIMER APP
 * Digital clock with stopwatch and countdown timer.
 */

type Mode = 'clock' | 'stopwatch' | 'timer';

export default function ClockApp() {
  const [mode, setMode] = useState<Mode>('clock');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  
  // Timer state
  const [timerTime, setTimerTime] = useState(0);
  const [timerInput, setTimerInput] = useState({ h: 0, m: 5, s: 0 });
  const [timerRunning, setTimerRunning] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update clock
  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Stopwatch logic
  useEffect(() => {
    if (stopwatchRunning) {
      intervalRef.current = setInterval(() => {
        setStopwatchTime(t => t + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stopwatchRunning]);

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerTime > 0) {
      intervalRef.current = setInterval(() => {
        setTimerTime(t => {
          if (t <= 1000) {
            setTimerRunning(false);
            getSoundController().playError();
            return 0;
          }
          return t - 1000;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timerTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).toUpperCase();
  };

  const formatStopwatch = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  const formatTimer = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startTimer = () => {
    const totalMs = (timerInput.h * 3600 + timerInput.m * 60 + timerInput.s) * 1000;
    if (totalMs > 0) {
      setTimerTime(totalMs);
      setTimerRunning(true);
      getSoundController().playStartup();
    }
  };

  const TabButton = ({ tab, label }: { tab: Mode; label: string }) => (
    <button
      onClick={() => {
        setMode(tab);
        getSoundController().playUserKeyClick();
      }}
      style={{
        flex: 1,
        padding: '8px',
        backgroundColor: mode === tab ? '#1a2a1a' : '#1a1a1a',
        color: mode === tab ? 'var(--terminal-green)' : '#666666',
        border: 'none',
        borderBottom: mode === tab ? '2px solid var(--terminal-green)' : '2px solid transparent',
        cursor: 'pointer',
        fontSize: '12px',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
    }}>
      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--terminal-border)' }}>
        <TabButton tab="clock" label="CLOCK" />
        <TabButton tab="stopwatch" label="STOPWATCH" />
        <TabButton tab="timer" label="TIMER" />
      </div>

      {/* CONTENT */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        {mode === 'clock' && (
          <>
            <div style={{
              fontSize: '48px',
              color: 'var(--terminal-green)',
              fontFamily: 'inherit',
              textShadow: '0 0 10px var(--terminal-green)',
              marginBottom: '12px',
            }}>
              {formatTime(currentTime)}
            </div>
            <div style={{
              fontSize: '16px',
              color: 'var(--terminal-amber)',
            }}>
              {formatDate(currentTime)}
            </div>
            <div style={{
              marginTop: '20px',
              padding: '12px 24px',
              border: '1px solid var(--terminal-border)',
              color: '#666666',
              fontSize: '12px',
            }}>
              SYSTEM CLOCK SYNCHRONIZED
            </div>
          </>
        )}

        {mode === 'stopwatch' && (
          <>
            <div style={{
              fontSize: '42px',
              color: stopwatchRunning ? 'var(--terminal-green)' : 'var(--terminal-amber)',
              fontFamily: 'inherit',
              textShadow: `0 0 10px ${stopwatchRunning ? 'var(--terminal-green)' : 'var(--terminal-amber)'}`,
              marginBottom: '24px',
            }}>
              {formatStopwatch(stopwatchTime)}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setStopwatchRunning(!stopwatchRunning);
                  getSoundController().playUserKeyClick();
                }}
                style={{
                  padding: '10px 24px',
                  backgroundColor: stopwatchRunning ? '#3a1a1a' : '#1a3a1a',
                  color: stopwatchRunning ? '#ff6666' : 'var(--terminal-green)',
                  border: `1px solid ${stopwatchRunning ? '#ff3333' : 'var(--terminal-green)'}`,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {stopwatchRunning ? '[ STOP ]' : '[ START ]'}
              </button>
              <button
                onClick={() => {
                  setStopwatchTime(0);
                  setStopwatchRunning(false);
                  getSoundController().playAIKeyClick();
                }}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#1a1a1a',
                  color: '#888888',
                  border: '1px solid #666666',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                [ RESET ]
              </button>
            </div>
          </>
        )}

        {mode === 'timer' && (
          <>
            {!timerRunning && timerTime === 0 ? (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={timerInput.h}
                      onChange={(e) => setTimerInput({ ...timerInput, h: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)) })}
                      style={{
                        width: '60px',
                        padding: '12px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid var(--terminal-border)',
                        color: 'var(--terminal-green)',
                        fontSize: '24px',
                        textAlign: 'center',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ color: '#666666', fontSize: '10px', marginTop: '4px' }}>HOURS</div>
                  </div>
                  <span style={{ fontSize: '24px', color: 'var(--terminal-green)' }}>:</span>
                  <div style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={timerInput.m}
                      onChange={(e) => setTimerInput({ ...timerInput, m: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) })}
                      style={{
                        width: '60px',
                        padding: '12px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid var(--terminal-border)',
                        color: 'var(--terminal-green)',
                        fontSize: '24px',
                        textAlign: 'center',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ color: '#666666', fontSize: '10px', marginTop: '4px' }}>MINS</div>
                  </div>
                  <span style={{ fontSize: '24px', color: 'var(--terminal-green)' }}>:</span>
                  <div style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={timerInput.s}
                      onChange={(e) => setTimerInput({ ...timerInput, s: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)) })}
                      style={{
                        width: '60px',
                        padding: '12px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid var(--terminal-border)',
                        color: 'var(--terminal-green)',
                        fontSize: '24px',
                        textAlign: 'center',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ color: '#666666', fontSize: '10px', marginTop: '4px' }}>SECS</div>
                  </div>
                </div>
                <button
                  onClick={startTimer}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#1a3a1a',
                    color: 'var(--terminal-green)',
                    border: '1px solid var(--terminal-green)',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  [ START TIMER ]
                </button>
              </>
            ) : (
              <>
                <div style={{
                  fontSize: '48px',
                  color: timerTime < 10000 ? '#ff3333' : 'var(--terminal-green)',
                  fontFamily: 'inherit',
                  textShadow: `0 0 10px ${timerTime < 10000 ? '#ff3333' : 'var(--terminal-green)'}`,
                  marginBottom: '24px',
                }}>
                  {formatTimer(timerTime)}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setTimerRunning(!timerRunning);
                      getSoundController().playUserKeyClick();
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: timerRunning ? '#3a1a1a' : '#1a3a1a',
                      color: timerRunning ? '#ff6666' : 'var(--terminal-green)',
                      border: `1px solid ${timerRunning ? '#ff3333' : 'var(--terminal-green)'}`,
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {timerRunning ? '[ PAUSE ]' : '[ RESUME ]'}
                  </button>
                  <button
                    onClick={() => {
                      setTimerTime(0);
                      setTimerRunning(false);
                      getSoundController().playAIKeyClick();
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#1a1a1a',
                      color: '#888888',
                      border: '1px solid #666666',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    [ CANCEL ]
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
