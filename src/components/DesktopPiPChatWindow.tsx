import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Ghost, Eye, MessageSquare, Flame } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'Mahad' | 'Ifa';
  content: string;
  type?: string;
  createdAt: number;
}

interface DesktopPiPChatWindowProps {
  currentUser: 'Mahad' | 'Ifa';
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClose: () => void;
}

const QUICK_EMOJIS = ['❤️', '🥺', '😂', '🍿', '✨', '🌹', '🌷'];

type OverlayTheme = 'ghost' | 'glass' | 'smoke';

export default function DesktopPiPChatWindow({
  currentUser,
  messages,
  onSendMessage,
  onClose
}: DesktopPiPChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState<OverlayTheme>('ghost');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const partnerName = currentUser === 'Mahad' ? 'Ifa' : 'Mahad';
  const partnerEmoji = partnerName === 'Mahad' ? '🌹' : '🌷';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText !== undefined ? customText : inputText).trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(text);
      if (customText === undefined) {
        setInputText('');
      }
    } catch (err) {
      console.warn('[DesktopPiP] Send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'ghost') return 'glass';
      if (prev === 'glass') return 'smoke';
      return 'ghost';
    });
  };

  const getContainerBg = () => {
    switch (theme) {
      case 'ghost':
        return 'transparent';
      case 'glass':
        return 'rgba(12, 14, 26, 0.45)';
      case 'smoke':
        return 'rgba(7, 8, 12, 0.78)';
    }
  };

  const getBackdropFilter = () => {
    switch (theme) {
      case 'ghost':
        return 'none';
      case 'glass':
        return 'blur(16px)';
      case 'smoke':
        return 'blur(20px)';
    }
  };

  const getBorder = () => {
    switch (theme) {
      case 'ghost':
        return 'none';
      case 'glass':
        return '1px solid rgba(255, 255, 255, 0.12)';
      case 'smoke':
        return '1px solid rgba(255, 255, 255, 0.18)';
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: getContainerBg(),
        backdropFilter: getBackdropFilter(),
        WebkitBackdropFilter: getBackdropFilter(),
        border: getBorder(),
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        transition: 'background-color 0.25s ease'
      }}
    >
      {/* 1. COMPACT DRAG HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: theme === 'ghost' 
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.15))' 
            : 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          borderBottom: theme === 'ghost' ? 'none' : '1px solid rgba(255,255,255,0.08)',
          cursor: 'grab'
        }}
      >
        {/* Partner badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 8px rgba(239,68,68,0.9)'
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.3px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {partnerName} {partnerEmoji}
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#fda4af',
              backgroundColor: 'rgba(244,63,94,0.25)',
              padding: '2px 6px',
              borderRadius: '999px',
              border: '1px solid rgba(244,63,94,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Live Overlay
          </span>
        </div>

        {/* Theme mode toggle & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={cycleTheme}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)'
            }}
            title="Toggle Transparent Ghost Mode / Frosted Glass / Smoke"
          >
            {theme === 'ghost' && <span>👻 Ghost HUD</span>}
            {theme === 'glass' && <span>🪟 Glass HUD</span>}
            {theme === 'smoke' && <span>🌑 Smoke HUD</span>}
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Overlay"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME FLOATING MESSAGES STREAM */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '10px 16px',
              borderRadius: '20px',
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              maxWidth: '85%'
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💬</div>
            Waiting for {partnerName}'s messages...
            <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.8, color: '#fda4af' }}>
              Transparent overlay active over your games & desktop
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === currentUser;
            const isMahad = msg.sender === 'Mahad';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: '6px'
                }}
              >
                {/* Avatar Badge */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isMahad
                      ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                      : 'linear-gradient(135deg, #ec4899, #e11d48)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                    border: '1.5px solid rgba(255,255,255,0.5)'
                  }}
                >
                  {isMahad ? 'M' : 'I'}
                </div>

                {/* Floating Clay Message Bubble */}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '8px 12px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isMe
                      ? 'rgba(244,63,94,0.45)'
                      : isMahad
                        ? 'rgba(30,58,138,0.85)'
                        : 'rgba(159,18,57,0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: isMe
                      ? '1px solid rgba(244,63,94,0.6)'
                      : isMahad
                        ? '1px solid rgba(147,197,253,0.5)'
                        : '1px solid rgba(251,113,133,0.5)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    wordBreak: 'break-word',
                    fontSize: '13px',
                    lineHeight: '1.35',
                    color: '#ffffff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)'
                  }}
                >
                  {!isMe && (
                    <div
                      style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        color: isMahad ? '#93c5fd' : '#fda4af',
                        marginBottom: '2px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{msg.sender}</span>
                      <span>{isMahad ? '🌹' : '🌷'}</span>
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK 1-TAP EMOJIS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          backgroundColor: theme === 'ghost' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.04)',
          borderTop: theme === 'ghost' ? 'none' : '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSubmit(undefined, emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '2px 3px',
              transition: 'transform 0.15s ease',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'
            }}
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* 4. QUICK WHISPER INPUT */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 10px',
          backgroundColor: theme === 'ghost' ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)',
          borderTop: theme === 'ghost' ? 'none' : '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={`Whisper to ${partnerName}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '999px',
            padding: '6px 12px',
            fontSize: '12px',
            color: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#f43f5e',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !isSending ? 'pointer' : 'default',
            opacity: inputText.trim() && !isSending ? 1 : 0.4,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(244,63,94,0.6)'
          }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
