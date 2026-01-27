'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getSoundController } from '@/lib/sound';

/**
 * ETHER APP
 * Web browser with search engine for the vintage OS.
 * Whitelist-only embedding for security. Search opens in new tab.
 */

// Domains allowed for iframe embedding (whitelist approach)
const ALLOWED_DOMAINS = [
  'duckduckgo.com',
  'en.wikipedia.org',
  'wikipedia.org',
  'archive.org',
  'openstreetmap.org',
  'www.openstreetmap.org',
];

const LOAD_TIMEOUT_MS = 5000; // 5 second timeout for loading

export default function EtherApp() {
  const [url, setUrl] = useState('https://duckduckgo.com');
  const [inputUrl, setInputUrl] = useState('https://duckduckgo.com');
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState<'NAVIGATING' | 'WAITING' | 'READY' | 'BLOCKED' | 'DENIED'>('NAVIGATING');
  const [history, setHistory] = useState<string[]>(['https://duckduckgo.com']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sites that allow iframe embedding
  const BOOKMARKS = [
    { name: 'DUCKDUCKGO', url: 'https://duckduckgo.com' },
    { name: 'WIKIPEDIA', url: 'https://en.wikipedia.org' },
    { name: 'ARCHIVE', url: 'https://archive.org' },
    { name: 'OPENSTREET', url: 'https://www.openstreetmap.org' },
  ];

  // Check if domain is in whitelist
  const isDomainAllowed = useCallback((urlStr: string): boolean => {
    try {
      const urlObj = new URL(urlStr);
      const hostname = urlObj.hostname.toLowerCase();
      return ALLOWED_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }, []);

  // Check if input is a search query (not a URL)
  const isSearchQuery = (input: string): boolean => {
    const trimmed = input.trim();
    // If it starts with http, it's a URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return false;
    }
    // If it has spaces or no dots, it's likely a search
    if (trimmed.includes(' ') || !trimmed.includes('.')) {
      return true;
    }
    return false;
  };

  // Clear timeout on unmount or when loading completes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Start load timeout when navigating
  const startLoadTimeout = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setLoadStatus('NAVIGATING');
    
    // After 2 seconds, show WAITING
    const waitingTimeout = setTimeout(() => {
      setLoadStatus('WAITING');
    }, 2000);
    
    // After full timeout, treat as BLOCKED
    timeoutRef.current = setTimeout(() => {
      clearTimeout(waitingTimeout);
      setLoading(false);
      setLoadStatus('BLOCKED');
    }, LOAD_TIMEOUT_MS);
    
    // Store waiting timeout for cleanup
    return () => {
      clearTimeout(waitingTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Open search in new tab (search is a MODE, not embedded)
  const performSearch = (query: string) => {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    getSoundController().playStartup();
  };

  const navigate = (newUrl: string) => {
    let finalUrl = newUrl.trim();
    
    // Check if this is a search query - open in new tab
    if (isSearchQuery(finalUrl)) {
      performSearch(finalUrl);
      return; // Don't navigate iframe
    }
    
    // Add https:// if no protocol
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    // WHITELIST CHECK - don't even try to load non-allowed domains
    if (!isDomainAllowed(finalUrl)) {
      setBlockedUrl(finalUrl);
      setLoadStatus('DENIED');
      setLoading(false);
      setInputUrl(finalUrl);
      getSoundController().playUserKeyClick();
      return;
    }

    // Clear blocked state for allowed domains
    setBlockedUrl(null);
    setLoading(true);
    startLoadTimeout();
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    getSoundController().playStartup();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(inputUrl);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevUrl = history[newIndex];
      
      // Check whitelist before navigating back
      if (!isDomainAllowed(prevUrl)) {
        setBlockedUrl(prevUrl);
        setLoadStatus('DENIED');
        setLoading(false);
        setInputUrl(prevUrl);
      } else {
        setBlockedUrl(null);
        setUrl(prevUrl);
        setInputUrl(prevUrl);
        setLoading(true);
        startLoadTimeout();
      }
      getSoundController().playUserKeyClick();
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextUrl = history[newIndex];
      
      // Check whitelist before navigating forward
      if (!isDomainAllowed(nextUrl)) {
        setBlockedUrl(nextUrl);
        setLoadStatus('DENIED');
        setLoading(false);
        setInputUrl(nextUrl);
      } else {
        setBlockedUrl(null);
        setUrl(nextUrl);
        setInputUrl(nextUrl);
        setLoading(true);
        startLoadTimeout();
      }
      getSoundController().playUserKeyClick();
    }
  };

  const refresh = () => {
    if (loadStatus === 'DENIED') return; // Can't refresh denied pages
    setLoading(true);
    startLoadTimeout();
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
    getSoundController().playAIKeyClick();
  };

  const goHome = () => {
    setBlockedUrl(null);
    navigate('https://duckduckgo.com');
  };

  const openInNewTab = () => {
    const targetUrl = blockedUrl || url;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    getSoundController().playStartup();
  };

  const handleIframeLoad = () => {
    // Clear the timeout - load succeeded
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLoading(false);
    setLoadStatus('READY');
  };

  const getDomainFromUrl = (urlStr: string) => {
    try {
      const urlObj = new URL(urlStr);
      return urlObj.hostname;
    } catch {
      return urlStr;
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
    }}>
      {/* TOOLBAR */}
      <div style={{
        padding: '6px 8px',
        borderBottom: '1px solid var(--terminal-border)',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        {/* NAVIGATION BUTTONS */}
        <button
          onClick={goBack}
          disabled={historyIndex === 0}
          style={{
            padding: '4px 8px',
            backgroundColor: historyIndex === 0 ? '#0a0a0a' : '#2a2a2a',
            color: historyIndex === 0 ? '#444444' : 'var(--terminal-green)',
            border: '1px solid var(--terminal-border)',
            cursor: historyIndex === 0 ? 'default' : 'pointer',
            fontSize: '12px',
          }}
        >
          ◀
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex >= history.length - 1}
          style={{
            padding: '4px 8px',
            backgroundColor: historyIndex >= history.length - 1 ? '#0a0a0a' : '#2a2a2a',
            color: historyIndex >= history.length - 1 ? '#444444' : 'var(--terminal-green)',
            border: '1px solid var(--terminal-border)',
            cursor: historyIndex >= history.length - 1 ? 'default' : 'pointer',
            fontSize: '12px',
          }}
        >
          ▶
        </button>
        <button
          onClick={refresh}
          style={{
            padding: '4px 8px',
            backgroundColor: '#2a2a2a',
            color: 'var(--terminal-green)',
            border: '1px solid var(--terminal-border)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ↻
        </button>
        <button
          onClick={goHome}
          style={{
            padding: '4px 8px',
            backgroundColor: '#2a2a2a',
            color: 'var(--terminal-green)',
            border: '1px solid var(--terminal-border)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ⌂
        </button>
        <button
          onClick={openInNewTab}
          title="Open in new tab"
          style={{
            padding: '4px 8px',
            backgroundColor: '#2a2a2a',
            color: 'var(--terminal-amber)',
            border: '1px solid var(--terminal-border)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ↗
        </button>

        {/* URL BAR */}
        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter URL or search..."
            className="terminal-input"
            style={{
              flex: 1,
              padding: '4px 8px',
              backgroundColor: '#0a0a0a',
              border: '1px solid var(--terminal-border)',
              color: 'var(--terminal-green)',
              fontSize: '12px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '4px 12px',
              backgroundColor: '#1a3a1a',
              color: 'var(--terminal-green)',
              border: '1px solid var(--terminal-green)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            GO
          </button>
        </form>
      </div>

      {/* BOOKMARKS BAR */}
      <div style={{
        padding: '4px 8px',
        borderBottom: '1px solid var(--terminal-border)',
        backgroundColor: '#151515',
        display: 'flex',
        gap: '8px',
        fontSize: '11px',
      }}>
        {BOOKMARKS.map((bm) => (
          <button
            key={bm.name}
            onClick={() => navigate(bm.url)}
            style={{
              padding: '2px 8px',
              backgroundColor: 'transparent',
              color: 'var(--terminal-amber)',
              border: '1px solid #333333',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            {bm.name}
          </button>
        ))}
      </div>

      {/* BROWSER VIEW */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}>
        {/* Loading overlay with status progression */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}>
            <div style={{ color: 'var(--terminal-green)', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                {loadStatus === 'NAVIGATING' && 'NAVIGATING...'}
                {loadStatus === 'WAITING' && 'WAITING FOR RESPONSE...'}
              </div>
              <div style={{ fontSize: '12px', color: '#666666' }}>{getDomainFromUrl(url)}</div>
              <div style={{ 
                fontSize: '10px', 
                color: '#444444', 
                marginTop: '12px' 
              }}>
                TIMEOUT: {LOAD_TIMEOUT_MS / 1000}s
              </div>
            </div>
          </div>
        )}
        
        {/* DENIED - Domain not in whitelist (security policy) */}
        {loadStatus === 'DENIED' && !loading && blockedUrl && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            padding: '20px',
          }}>
            <div style={{
              border: '2px solid var(--terminal-amber)',
              padding: '30px 40px',
              maxWidth: '450px',
              textAlign: 'center',
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                color: 'var(--terminal-amber)',
              }}>
                ⛔
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: 'var(--terminal-amber)',
                marginBottom: '8px',
                letterSpacing: '2px',
              }}>
                EMBEDDING NOT PERMITTED
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#888888',
                marginBottom: '16px',
              }}>
                SECURITY POLICY ENFORCED
              </div>
              <div style={{
                fontSize: '14px',
                color: 'var(--terminal-green)',
                marginBottom: '20px',
                wordBreak: 'break-all',
                padding: '8px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
              }}>
                {getDomainFromUrl(blockedUrl)}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#555555',
                marginBottom: '16px',
              }}>
                ONLY WHITELISTED DOMAINS MAY BE EMBEDDED
              </div>
              <button
                onClick={openInNewTab}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#1a3a1a',
                  color: 'var(--terminal-green)',
                  border: '2px solid var(--terminal-green)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              >
                [ OPEN IN NEW TAB ]
              </button>
            </div>
          </div>
        )}
        
        {/* BLOCKED - Timeout reached (no response) */}
        {loadStatus === 'BLOCKED' && !loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            padding: '20px',
          }}>
            <div style={{
              border: '2px solid #ff6666',
              padding: '30px 40px',
              maxWidth: '400px',
              textAlign: 'center',
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                color: '#ff6666',
              }}>
                ⚠
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#ff6666',
                marginBottom: '8px',
                letterSpacing: '2px',
              }}>
                CONNECTION TIMEOUT
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#888888',
                marginBottom: '16px',
              }}>
                NO RESPONSE RECEIVED
              </div>
              <div style={{
                fontSize: '16px',
                color: 'var(--terminal-amber)',
                marginBottom: '16px',
                wordBreak: 'break-all',
              }}>
                {getDomainFromUrl(url)}
              </div>
              <button
                onClick={openInNewTab}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#1a3a1a',
                  color: 'var(--terminal-green)',
                  border: '2px solid var(--terminal-green)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              >
                [ OPEN IN NEW TAB ]
              </button>
            </div>
          </div>
        )}

        {/* Main iframe - only render when not DENIED */}
        {loadStatus !== 'DENIED' && (
          <iframe
            ref={iframeRef}
            src={url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            onLoad={handleIframeLoad}
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      {/* STATUS BAR */}
      <div style={{
        padding: '4px 8px',
        borderTop: '1px solid var(--terminal-border)',
        backgroundColor: '#1a1a1a',
        fontSize: '11px',
        color: '#666666',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>
          {loading && loadStatus === 'NAVIGATING' && 'NAVIGATING...'}
          {loading && loadStatus === 'WAITING' && 'WAITING...'}
          {!loading && loadStatus === 'READY' && 'READY'}
          {!loading && loadStatus === 'BLOCKED' && 'TIMEOUT'}
          {!loading && loadStatus === 'DENIED' && 'DENIED'}
        </span>
        <span>ETHER BROWSER v1.0</span>
        <span>WHITELIST: {ALLOWED_DOMAINS.length} DOMAINS</span>
      </div>
    </div>
  );
}
