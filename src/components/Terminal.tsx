'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TypewriterEngine } from '@/lib/typewriter';
import { getSoundController } from '@/lib/sound';
import { AvatarState } from '@/lib/avatarStates';

interface Message {
  role: 'user' | 'system';
  content: string;
  timestamp: number;
}

interface TerminalProps {
  onStateChange: (state: AvatarState) => void;
  browserMode?: boolean;
  userName?: string | null;
}

const BOOT_SEQUENCE = [
  'NIKATA-OS v1.0.0',
  'COPYRIGHT (C) 1987 NIKATA SYSTEMS INC.',
  '',
  'INITIALIZING MEMORY... OK',
  'LOADING AI MODULE... OK',
  'ESTABLISHING NEURAL LINK... OK',
  '',
  'TYPE YOUR MESSAGE AND PRESS ENTER.',
  'TYPE "CLEAR" TO RESET TERMINAL.',
  'TYPE "HELP" FOR COMMANDS.',
  '',
  '================================',
  '',
];

/**
 * TERMINAL COMPONENT
 * Main chat interface with typewriter effect.
 * Handles input, output, and chat state management.
 */
export default function Terminal({ onStateChange, browserMode = false, userName }: TerminalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBooted, setIsBooted] = useState(false);
  const [bootText, setBootText] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<TypewriterEngine | null>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('nikata_chat_history');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('nikata_chat_history', JSON.stringify(messages));
      
      // Also save a session log for the Files app
      const sessions = JSON.parse(localStorage.getItem('nikata_sessions') || '[]');
      const today = new Date().toISOString().split('T')[0];
      const existingSession = sessions.find((s: { date: string }) => s.date === today);
      
      if (existingSession) {
        existingSession.messages = messages;
        existingSession.messageCount = messages.length;
      } else {
        sessions.push({
          date: today,
          messages: messages,
          messageCount: messages.length,
          user: userName || 'UNKNOWN'
        });
      }
      
      localStorage.setItem('nikata_sessions', JSON.stringify(sessions));
    }
  }, [messages, userName]);

  // Initialize typewriter engine
  useEffect(() => {
    typewriterRef.current = new TypewriterEngine({
      baseDelay: 35,
      variance: 15,
      punctuationDelay: 100,
    });

    return () => {
      typewriterRef.current?.stop();
    };
  }, []);

  // Boot sequence
  useEffect(() => {
    const sound = getSoundController();
    sound.playStartup();

    const bootMessage = BOOT_SEQUENCE.join('\n');
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
        setIsBooted(true);
        onStateChange('idle');
      }
    }, 20);

    return () => clearInterval(bootInterval);
  }, [onStateChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages, currentOutput, bootText]);

  // Focus input when ready
  useEffect(() => {
    if (isBooted && !isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isBooted, isTyping]);

  // Handle user input with sound
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const sound = getSoundController();
    
    // Play sound only when adding characters (not deleting)
    if (newValue.length > inputValue.length) {
      sound.playUserKeyClick();
    }
    
    setInputValue(newValue);
  }, [inputValue]);

  const typeResponse = useCallback(async (text: string) => {
    if (!typewriterRef.current) return;

    const sound = getSoundController();
    setIsTyping(true);
    onStateChange('responding');

    await typewriterRef.current.type(
      text,
      (currentText, isComplete) => {
        setCurrentOutput(currentText);
        if (isComplete) {
          setMessages(prev => [...prev, {
            role: 'system',
            content: text,
            timestamp: Date.now(),
          }]);
          setCurrentOutput('');
          setIsTyping(false);
          onStateChange('idle');
        }
      },
      () => {
        sound.playAIKeyClick();
      }
    );
  }, [onStateChange]);

  const handleCommand = useCallback(async (input: string) => {
    const trimmed = input.trim().toUpperCase();

    if (trimmed === 'CLEAR') {
      setMessages([]);
      return;
    }

    if (trimmed === 'HELP') {
      await typeResponse(
        'AVAILABLE COMMANDS:\n' +
        '  CLEAR - RESET TERMINAL\n' +
        '  HELP  - SHOW THIS MESSAGE\n' +
        '  TIME  - DISPLAY SYSTEM TIME\n' +
        '  VER   - SHOW VERSION\n' +
        'OR TYPE ANY MESSAGE TO CHAT WITH AI.'
      );
      return;
    }

    if (trimmed === 'TIME') {
      const now = new Date();
      await typeResponse(`SYSTEM TIME: ${now.toLocaleTimeString()}`);
      return;
    }

    if (trimmed === 'VER') {
      await typeResponse('NIKATA-OS v1.0.0\nAI MODULE: GROQ NEURAL CORE\nBROWSER AGENT: BROWSER-USE SDK\nBUILD DATE: 1987-01-01');
      return;
    }

    // Choose API based on browser mode
    const apiEndpoint = browserMode ? '/api/browser' : '/api/chat';
    
    // Send to appropriate API
    onStateChange('thinking');

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('NETWORK ERROR');

      const data = await response.json();
      
      // Add source indicator for browser mode
      const responseText = browserMode && data.source === 'BROWSER_AGENT' 
        ? `[WEB SCAN COMPLETE]\n${data.response}`
        : data.response;
        
      await typeResponse(responseText);
    } catch {
      onStateChange('error');
      getSoundController().playError();
      const errorMsg = browserMode 
        ? 'ERROR: WEB AGENT COMMUNICATION FAILURE. CHECK NETWORK CONNECTION.'
        : 'ERROR: COMMUNICATION FAILURE WITH MAINFRAME. RETRY TRANSMISSION.';
      await typeResponse(errorMsg);
    }
  }, [onStateChange, typeResponse, browserMode]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    }]);
    setInputValue('');

    handleCommand(userMessage);
  }, [inputValue, isTyping, handleCommand]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0a0a0a',
    }}>
      {/* TERMINAL HEADER */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '2px solid var(--terminal-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
      }}>
        <span>
          NIKATA TERMINAL v1.0 
          {browserMode && (
            <span style={{ color: 'var(--terminal-amber)', marginLeft: '8px' }}>
              [WEB MODE]
            </span>
          )}
        </span>
        <span style={{ color: '#666666' }}>
          {isTyping ? '[PROCESSING...]' : '[READY]'}
        </span>
      </div>

      {/* TERMINAL OUTPUT */}
      <div
        ref={outputRef}
        style={{
          flex: 1,
          padding: '12px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {/* BOOT SEQUENCE */}
        {bootText && (
          <div style={{ color: '#666666', marginBottom: '8px' }}>
            {bootText}
          </div>
        )}

        {/* MESSAGE HISTORY */}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: '4px' }}>
            <span style={{ color: '#666666' }}>
              [{formatTimestamp(msg.timestamp)}]
            </span>
            <span style={{
              color: msg.role === 'user' ? 'var(--terminal-amber)' : 'var(--terminal-green)',
              marginLeft: '8px',
            }}>
              {msg.role === 'user' ? 'USER>' : 'NIKATA>'}
            </span>
            <span style={{ marginLeft: '8px' }}>
              {msg.content}
            </span>
          </div>
        ))}

        {/* CURRENT TYPING OUTPUT */}
        {currentOutput && (
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#666666' }}>
              [{formatTimestamp(Date.now())}]
            </span>
            <span style={{
              color: 'var(--terminal-green)',
              marginLeft: '8px',
            }}>
              NIKATA&gt;
            </span>
            <span style={{ marginLeft: '8px' }}>
              {currentOutput}
              <span className="cursor-blink" style={{
                backgroundColor: 'var(--terminal-green)',
                marginLeft: '2px',
              }}>_</span>
            </span>
          </div>
        )}
      </div>

      {/* INPUT LINE */}
      <form onSubmit={handleSubmit} style={{
        padding: '12px',
        borderTop: '2px solid var(--terminal-border)',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#0d0d0d',
      }}>
        <span style={{ color: 'var(--terminal-amber)', marginRight: '8px' }}>
          INPUT&gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          disabled={!isBooted || isTyping}
          className="terminal-input"
          autoComplete="off"
          spellCheck={false}
        />
        {!isTyping && isBooted && (
          <span className="cursor-blink" style={{
            backgroundColor: 'var(--terminal-green)',
            width: '10px',
            height: '18px',
            display: 'inline-block',
          }} />
        )}
      </form>
    </div>
  );
}
