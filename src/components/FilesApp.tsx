'use client';

import { useState, useEffect } from 'react';

/**
 * FILES APP
 * File browser with chat history from localStorage.
 */

interface ChatMessage {
  role: 'user' | 'system';
  content: string;
  timestamp: number;
}

interface ChatSession {
  date: string;
  messages: ChatMessage[];
  messageCount: number;
  user: string;
}

const SYSTEM_FILES = [
  { name: 'README.TXT', size: '1.2K', date: '01-15-87', type: 'system' },
  { name: 'SYSTEM.DAT', size: '24K', date: '01-01-87', type: 'system' },
  { name: 'CONFIG.SYS', size: '512B', date: '01-10-87', type: 'system' },
  { name: 'AUTOEXEC.BAT', size: '256B', date: '01-10-87', type: 'system' },
];

export default function FilesApp() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [currentPath, setCurrentPath] = useState('C:\\NIKATA-OS\\');

  // Load chat sessions from localStorage
  useEffect(() => {
    const loadSessions = () => {
      const saved = localStorage.getItem('nikata_sessions');
      if (saved) {
        try {
          setSessions(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load sessions:', e);
        }
      }
    };
    
    loadSessions();
    // Refresh every second in case new chats come in
    const interval = setInterval(loadSessions, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}-${d.getFullYear().toString().slice(-2)}`;
  };

  const formatSize = (messages: ChatMessage[]) => {
    const bytes = JSON.stringify(messages).length;
    if (bytes < 1024) return `${bytes}B`;
    return `${(bytes / 1024).toFixed(1)}K`;
  };

  const handleFileClick = (fileName: string, type: string) => {
    if (type === 'chat') {
      const session = sessions.find(s => `CHAT_${s.date}.LOG` === fileName);
      if (session) {
        setSelectedFile(fileName);
        setCurrentPath(`C:\\NIKATA-OS\\CHATLOGS\\${fileName}`);
        
        // Format chat content
        let content = `════════════════════════════════════════\n`;
        content += `  CHAT LOG: ${session.date}\n`;
        content += `  USER: ${session.user}\n`;
        content += `  MESSAGES: ${session.messageCount}\n`;
        content += `════════════════════════════════════════\n\n`;
        
        session.messages.forEach(msg => {
          const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          });
          const prefix = msg.role === 'user' ? 'USER' : 'NIKATA';
          content += `[${time}] ${prefix}>\n${msg.content}\n\n`;
        });
        
        setFileContent(content);
      }
    } else if (type === 'system') {
      setSelectedFile(fileName);
      setCurrentPath(`C:\\NIKATA-OS\\${fileName}`);
      
      // Show system file content
      if (fileName === 'README.TXT') {
        setFileContent(
          `════════════════════════════════════════\n` +
          `  NIKATA-OS README FILE\n` +
          `════════════════════════════════════════\n\n` +
          `WELCOME TO NIKATA-OS v1.0\n\n` +
          `This system provides:\n` +
          `- AI CHAT TERMINAL (NIKATA)\n` +
          `- FILE MANAGEMENT (FILES)\n` +
          `- NETWORK STATUS (ETHER)\n\n` +
          `Your chat history is automatically saved\n` +
          `and can be viewed in the CHATLOGS folder.\n\n` +
          `(C) 1987 NIKATA SYSTEMS INC.`
        );
      } else {
        setFileContent(`[SYSTEM FILE - ACCESS RESTRICTED]\n\nFile: ${fileName}\nType: SYSTEM\nAccess: READ-ONLY`);
      }
    } else if (type === 'dir') {
      if (fileName === 'CHATLOGS') {
        setCurrentPath('C:\\NIKATA-OS\\CHATLOGS\\');
        setSelectedFile(null);
        setFileContent('');
      }
    }
  };

  const goBack = () => {
    setCurrentPath('C:\\NIKATA-OS\\');
    setSelectedFile(null);
    setFileContent('');
  };

  const deleteChat = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent file click
    
    const dateMatch = fileName.match(/CHAT_(.+)\.LOG/);
    if (!dateMatch) return;
    
    const dateToDelete = dateMatch[1];
    
    // Remove from sessions
    const updatedSessions = sessions.filter(s => s.date !== dateToDelete);
    setSessions(updatedSessions);
    localStorage.setItem('nikata_sessions', JSON.stringify(updatedSessions));
    
    // Also update chat history if it's today's chat
    const today = new Date().toISOString().split('T')[0];
    if (dateToDelete === today) {
      localStorage.removeItem('nikata_chat_history');
    }
  };

  const deleteAllChats = () => {
    setSessions([]);
    localStorage.removeItem('nikata_sessions');
    localStorage.removeItem('nikata_chat_history');
  };

  const isInChatlogs = currentPath.includes('CHATLOGS');

  // Build file list
  const files = isInChatlogs
    ? sessions.map(s => ({
        name: `CHAT_${s.date}.LOG`,
        size: formatSize(s.messages),
        date: formatDate(s.date),
        type: 'chat' as const,
      }))
    : [
        ...SYSTEM_FILES,
        { name: 'CHATLOGS', size: '<DIR>', date: formatDate(new Date().toISOString()), type: 'dir' as const },
      ];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
    }}>
      {/* HEADER */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--terminal-border)',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        {(isInChatlogs || selectedFile) && (
          <button
            onClick={goBack}
            style={{
              background: 'none',
              border: '1px solid var(--terminal-border)',
              color: 'var(--terminal-green)',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            [BACK]
          </button>
        )}
        <span style={{ color: '#666666', flex: 1 }}>{currentPath}</span>
        {isInChatlogs && !selectedFile && sessions.length > 0 && (
          <button
            onClick={deleteAllChats}
            style={{
              background: 'none',
              border: '1px solid #ff3333',
              color: '#ff3333',
              padding: '2px 8px',
              cursor: 'pointer',
              fontSize: '10px',
            }}
          >
            [DEL ALL]
          </button>
        )}
      </div>

      {selectedFile && fileContent ? (
        /* FILE VIEWER */
        <div style={{
          flex: 1,
          padding: '12px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.4',
        }}>
          {fileContent}
        </div>
      ) : (
        <>
          {/* FILE LIST HEADER */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--terminal-border)',
            display: 'flex',
            color: 'var(--terminal-amber)',
            fontSize: '14px',
          }}>
            <span style={{ width: '180px' }}>NAME</span>
            <span style={{ width: '60px', textAlign: 'right' }}>SIZE</span>
            <span style={{ width: '80px', textAlign: 'right' }}>DATE</span>
            {isInChatlogs && <span style={{ width: '50px', textAlign: 'center' }}>DEL</span>}
          </div>

          {/* FILE LIST */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 12px',
          }}>
            {files.length === 0 ? (
              <div style={{ color: '#666666', padding: '12px 0' }}>
                NO FILES FOUND.
              </div>
            ) : (
              files.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => handleFileClick(file.name, file.type)}
                  style={{
                    display: 'flex',
                    padding: '4px 0',
                    cursor: 'pointer',
                    color: file.type === 'dir' ? 'var(--terminal-amber)' : 
                           file.type === 'chat' ? 'var(--terminal-green)' : '#888888',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ width: '180px' }}>
                    {file.type === 'dir' ? '[' : ''}{file.name}{file.type === 'dir' ? ']' : ''}
                  </span>
                  <span style={{ width: '60px', textAlign: 'right' }}>{file.size}</span>
                  <span style={{ width: '80px', textAlign: 'right' }}>{file.date}</span>
                  {file.type === 'chat' && (
                    <span style={{ width: '50px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => deleteChat(file.name, e)}
                        style={{
                          background: 'none',
                          border: '1px solid #ff3333',
                          color: '#ff3333',
                          padding: '1px 6px',
                          cursor: 'pointer',
                          fontSize: '10px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3a1a1a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        X
                      </button>
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* STATUS BAR */}
      <div style={{
        padding: '6px 12px',
        borderTop: '1px solid var(--terminal-border)',
        backgroundColor: '#1a1a1a',
        fontSize: '12px',
        color: '#666666',
      }}>
        {files.length} ITEMS | {sessions.length} CHAT LOGS | 640K FREE
      </div>
    </div>
  );
}
