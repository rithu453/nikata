'use client';

import { useState, useRef, useEffect } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * CMD APP
 * Command prompt terminal emulator with basic commands.
 */

interface HistoryEntry {
  command: string;
  output: string[];
  isError?: boolean;
}

export default function CmdApp() {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { command: '', output: ['NIKATA-OS COMMAND PROMPT v1.0', 'Type HELP for available commands.', ''] }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState('C:\\NIKATA');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on click anywhere
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    const parts = trimmedCmd.split(' ');
    const command = parts[0].toUpperCase();
    const args = parts.slice(1);

    let output: string[] = [];
    let isError = false;

    switch (command) {
      case '':
        break;

      case 'HELP':
        output = [
          'Available commands:',
          '',
          '  HELP          - Show this help message',
          '  CLS           - Clear screen',
          '  DATE          - Display current date',
          '  TIME          - Display current time',
          '  ECHO [text]   - Display text',
          '  DIR           - List directory contents',
          '  CD [dir]      - Change directory',
          '  VER           - Display version',
          '  WHOAMI        - Display current user',
          '  HOSTNAME      - Display computer name',
          '  PING [host]   - Ping a host',
          '  CALC [expr]   - Calculate expression',
          '  COLOR [code]  - Change color (not implemented)',
          '  EXIT          - Close terminal',
          '',
        ];
        break;

      case 'CLS':
      case 'CLEAR':
        setHistory([]);
        return;

      case 'DATE':
        output = [new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })];
        break;

      case 'TIME':
        output = [new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })];
        break;

      case 'ECHO':
        output = [args.join(' ') || ''];
        break;

      case 'DIR':
        output = [
          ` Volume in drive C is NIKATA-OS`,
          ` Directory of ${currentDir}`,
          '',
          '01/27/2026  12:00 PM    <DIR>          .',
          '01/27/2026  12:00 PM    <DIR>          ..',
          '01/27/2026  10:30 AM    <DIR>          SYSTEM',
          '01/27/2026  10:30 AM    <DIR>          PROGRAMS',
          '01/27/2026  10:30 AM    <DIR>          USERS',
          '01/15/2026  09:15 AM            1,024  CONFIG.SYS',
          '01/15/2026  09:15 AM            2,048  AUTOEXEC.BAT',
          '01/20/2026  02:30 PM           12,288  README.TXT',
          '               3 File(s)         15,360 bytes',
          '               5 Dir(s)   524,288,000 bytes free',
          '',
        ];
        break;

      case 'CD':
        if (args.length === 0) {
          output = [currentDir];
        } else if (args[0] === '..') {
          const parts = currentDir.split('\\');
          if (parts.length > 1) {
            parts.pop();
            setCurrentDir(parts.join('\\') || 'C:');
          }
        } else if (args[0] === '\\' || args[0] === '/') {
          setCurrentDir('C:');
        } else {
          setCurrentDir(`${currentDir}\\${args[0].toUpperCase()}`);
        }
        break;

      case 'VER':
        output = [
          '',
          'NIKATA-OS [Version 1.0.1987]',
          '(c) 2026 Nikata Systems. All rights reserved.',
          '',
        ];
        break;

      case 'WHOAMI':
        const username = localStorage.getItem('nikata_username') || 'GUEST';
        output = [`NIKATA\\${username.toUpperCase()}`];
        break;

      case 'HOSTNAME':
        output = ['NIKATA-PC'];
        break;

      case 'PING':
        if (args.length === 0) {
          output = ['Usage: PING [hostname]'];
          isError = true;
        } else {
          const host = args[0];
          output = [
            `Pinging ${host} with 32 bytes of data:`,
            '',
            `Reply from ${host}: bytes=32 time=${Math.floor(Math.random() * 50 + 10)}ms TTL=128`,
            `Reply from ${host}: bytes=32 time=${Math.floor(Math.random() * 50 + 10)}ms TTL=128`,
            `Reply from ${host}: bytes=32 time=${Math.floor(Math.random() * 50 + 10)}ms TTL=128`,
            `Reply from ${host}: bytes=32 time=${Math.floor(Math.random() * 50 + 10)}ms TTL=128`,
            '',
            `Ping statistics for ${host}:`,
            '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)',
            '',
          ];
        }
        break;

      case 'CALC':
        if (args.length === 0) {
          output = ['Usage: CALC [expression]', 'Example: CALC 2+2'];
          isError = true;
        } else {
          try {
            const expr = args.join('').replace(/[^0-9+\-*/.()]/g, '');
            const result = Function(`"use strict"; return (${expr})`)();
            output = [`${args.join(' ')} = ${result}`];
          } catch {
            output = ['Error: Invalid expression'];
            isError = true;
          }
        }
        break;

      case 'EXIT':
        output = ['Closing terminal... (Terminal cannot be closed from here)'];
        break;

      case 'MATRIX':
        output = [
          'Wake up, Neo...',
          'The Matrix has you...',
          'Follow the white rabbit.',
          '',
        ];
        break;

      case 'HELLO':
        output = ['Hello, World!'];
        break;

      default:
        output = [`'${command}' is not recognized as an internal or external command.`, 'Type HELP for available commands.'];
        isError = true;
    }

    const newEntry: HistoryEntry = {
      command: trimmedCmd,
      output,
      isError,
    };

    setHistory(prev => [...prev, newEntry]);
    
    if (trimmedCmd) {
      setCommandHistory(prev => [...prev, trimmedCmd]);
    }
    setHistoryIndex(-1);
    
    getSoundController().playUserKeyClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
        cursor: 'text',
      }}
    >
      {/* OUTPUT */}
      <div
        ref={outputRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          fontSize: '14px',
          lineHeight: '1.4',
        }}
      >
        {history.map((entry, idx) => (
          <div key={idx}>
            {entry.command && (
              <div style={{ color: 'var(--terminal-green)' }}>
                <span style={{ color: 'var(--terminal-amber)' }}>{currentDir}&gt;</span> {entry.command}
              </div>
            )}
            {entry.output.map((line, lineIdx) => (
              <div
                key={lineIdx}
                style={{
                  color: entry.isError ? '#ff6666' : '#cccccc',
                  whiteSpace: 'pre',
                }}
              >
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        ))}

        {/* INPUT LINE */}
        <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
          <span style={{ color: 'var(--terminal-amber)' }}>{currentDir}&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--terminal-green)',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              outline: 'none',
              marginLeft: '4px',
            }}
          />
          <span className="cursor-blink" style={{
            backgroundColor: 'var(--terminal-green)',
            width: '8px',
            height: '16px',
            display: 'inline-block',
          }} />
        </form>
      </div>
    </div>
  );
}
