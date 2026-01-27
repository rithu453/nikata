'use client';

import { useState, useEffect } from 'react';
import DesktopIcon, { AppType } from '@/components/DesktopIcon';
import Window from '@/components/Window';
import FilesApp from '@/components/FilesApp';
import EtherApp from '@/components/EtherApp';
import NikataApp from '@/components/NikataApp';
import TetrisApp from '@/components/TetrisApp';
import TaskListApp from '@/components/TaskListApp';
import NotesApp from '@/components/NotesApp';
import ClockApp from '@/components/ClockApp';
import CalcApp from '@/components/CalcApp';
import StickyNotesApp from '@/components/StickyNotesApp';
import CmdApp from '@/components/CmdApp';
import { getSoundController } from '@/lib/sound';

interface OpenWindow {
  app: AppType;
  title: string;
}

const APPS: { type: AppType; label: string; title: string }[] = [
  { type: 'files', label: 'FILES', title: 'FILE MANAGER' },
  { type: 'ether', label: 'ETHER', title: 'ETHER BROWSER' },
  { type: 'nikata', label: 'NIKATA', title: 'NIKATA AI TERMINAL' },
  { type: 'tetris', label: 'TETRIS', title: 'TETRIS v1.0' },
  { type: 'tasks', label: 'TASKS', title: 'TASK MANAGER' },
  { type: 'notes', label: 'NOTES', title: 'NOTES EDITOR' },
  { type: 'clock', label: 'CLOCK', title: 'CLOCK & TIMER' },
  { type: 'calc', label: 'CALC', title: 'CALCULATOR' },
  { type: 'sticky', label: 'STICKY', title: 'STICKY NOTES' },
  { type: 'cmd', label: 'CMD', title: 'COMMAND PROMPT' },
];

/**
 * MAIN PAGE - DESKTOP
 * Vintage OS desktop with app icons and windows.
 * Boot sequence plays on first load.
 */
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [booting, setBooting] = useState(true);
  const [bootText, setBootText] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<AppType | null>(null);
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [currentTime, setCurrentTime] = useState('');

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Boot sequence
  useEffect(() => {
    if (!mounted) return;

    const sound = getSoundController();
    sound.playStartup();

    const bootLines = [
      'NIKATA-OS BIOS v1.0',
      'COPYRIGHT (C) 1987 NIKATA SYSTEMS INC.',
      '',
      'PERFORMING SYSTEM CHECK...',
      '',
      'CPU............ 4.77 MHZ [OK]',
      'MEMORY......... 640K [OK]',
      'VIDEO.......... VGA MONO [OK]',
      'KEYBOARD....... DETECTED [OK]',
      'DISK DRIVE..... C: [OK]',
      '',
      'LOADING NIKATA-OS...',
      '',
      'INITIALIZING DESKTOP ENVIRONMENT...',
      '',
      'SYSTEM READY.',
      '',
    ];

    const bootMessage = bootLines.join('\n');
    let index = 0;

    const bootInterval = setInterval(() => {
      if (index <= bootMessage.length) {
        setBootText(bootMessage.substring(0, index));
        if (bootMessage[index] && bootMessage[index] !== '\n' && bootMessage[index] !== ' ') {
          sound.playAIKeyClick();
        }
        index++;
      } else {
        clearInterval(bootInterval);
        setTimeout(() => {
          setBooting(false);
        }, 500);
      }
    }, 25);

    return () => clearInterval(bootInterval);
  }, [mounted]);

  const openApp = (app: AppType) => {
    const appInfo = APPS.find(a => a.type === app);
    if (!appInfo) return;

    // Check if already open
    if (openWindows.some(w => w.app === app)) {
      return;
    }

    setOpenWindows(prev => [...prev, { app, title: appInfo.title }]);
  };

  const closeWindow = (app: AppType) => {
    setOpenWindows(prev => prev.filter(w => w.app !== app));
  };

  const renderAppContent = (app: AppType) => {
    switch (app) {
      case 'files':
        return <FilesApp />;
      case 'ether':
        return <EtherApp />;
      case 'nikata':
        return <NikataApp />;
      case 'tetris':
        return <TetrisApp />;
      case 'tasks':
        return <TaskListApp />;
      case 'notes':
        return <NotesApp />;
      case 'clock':
        return <ClockApp />;
      case 'calc':
        return <CalcApp />;
      case 'sticky':
        return <StickyNotesApp />;
      case 'cmd':
        return <CmdApp />;
    }
  };

  if (!mounted) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--terminal-green)',
      }}>
        LOADING...
      </div>
    );
  }

  // BOOT SCREEN
  if (booting) {
    return (
      <main
        className="crt-effect crt-flicker"
        style={{
          height: '100vh',
          backgroundColor: '#0a0a0a',
          padding: '40px',
          overflow: 'hidden',
        }}
      >
        <pre style={{
          fontFamily: 'inherit',
          fontSize: '16px',
          color: 'var(--terminal-green)',
          whiteSpace: 'pre-wrap',
        }}>
          {bootText}
          <span className="cursor-blink" style={{
            backgroundColor: 'var(--terminal-green)',
          }}>_</span>
        </pre>
      </main>
    );
  }

  // DESKTOP
  return (
    <main
      className="crt-effect crt-flicker pixel-dots pixel-grid"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        position: 'relative',
        border: '4px solid var(--terminal-green)',
        boxShadow: 'inset 0 0 20px rgba(51, 255, 51, 0.1), 0 0 10px rgba(51, 255, 51, 0.3)',
      }}
    >
      {/* MENU BAR */}
      <header
        className="pixel-border"
        style={{
          padding: '4px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          zIndex: 200,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="text-glow" style={{ fontSize: '14px' }}>NIKATA-OS</span>
          <span style={{ color: '#666666', fontSize: '12px' }}>|</span>
          <span style={{ color: '#666666', fontSize: '12px' }}>DESKTOP v1.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
          <span style={{ color: '#666666' }}>MEM: 640K</span>
          <span style={{ color: 'var(--terminal-amber)' }}>{currentTime}</span>
        </div>
      </header>

      {/* DESKTOP AREA */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          padding: '20px',
          backgroundImage: 'radial-gradient(circle, #1a1a1a 1.5px, transparent 1.5px)',
          backgroundSize: '8px 8px',
        }}
        onClick={() => setSelectedIcon(null)}
      >
        {/* DESKTOP ICONS - 2 columns, 4 per column */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 80px)',
          gridTemplateRows: 'repeat(4, auto)',
          gap: '8px 16px',
          position: 'absolute',
          top: '20px',
          left: '20px',
        }}>
          {APPS.map((app) => (
            <DesktopIcon
              key={app.type}
              app={app.type}
              label={app.label}
              isSelected={selectedIcon === app.type}
              onSelect={() => setSelectedIcon(app.type)}
              onDoubleClick={() => openApp(app.type)}
            />
          ))}
        </div>

        {/* OPEN WINDOWS */}
        {openWindows.map((window) => (
          <Window
            key={window.app}
            title={window.title}
            onClose={() => closeWindow(window.app)}
            width={
              window.app === 'nikata' ? '1000px' :
              window.app === 'tetris' ? '456px' :
              window.app === 'notes' ? '550px' :
              window.app === 'calc' ? '420px' :
              window.app === 'tasks' ? '450px' :
              window.app === 'clock' ? '380px' :
              window.app === 'sticky' ? '550px' :
              window.app === 'ether' ? '800px' :
              window.app === 'cmd' ? '650px' :
              '600px'
            }
            height={
              window.app === 'nikata' ? '500px' :
              window.app === 'tetris' ? '528px' :
              window.app === 'notes' ? '400px' :
              window.app === 'calc' ? '450px' :
              window.app === 'tasks' ? '400px' :
              window.app === 'clock' ? '350px' :
              window.app === 'sticky' ? '400px' :
              window.app === 'ether' ? '550px' :
              window.app === 'cmd' ? '400px' :
              '450px'
            }
          >
            {renderAppContent(window.app)}
          </Window>
        ))}
      </div>

      {/* TASKBAR */}
      <footer
        className="pixel-border"
        style={{
          padding: '4px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          fontSize: '12px',
          zIndex: 200,
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {openWindows.map((window) => (
            <div
              key={window.app}
              style={{
                padding: '2px 8px',
                backgroundColor: '#333333',
                border: '1px solid #444444',
                color: 'var(--terminal-green)',
                cursor: 'pointer',
              }}
            >
              {window.title}
            </div>
          ))}
        </div>
        <span style={{ color: '#666666' }}>
          READY | DOUBLE-CLICK ICON TO OPEN
        </span>
      </footer>
    </main>
  );
}
