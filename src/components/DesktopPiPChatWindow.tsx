import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, Ghost, Sliders, Volume2 } from 'lucide-react';

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

export default function DesktopPiPChatWindow({
  currentUser,
  messages,
  onSendMessage,
  onClose
}: DesktopPiPChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  // Default to 0% background opacity for 100% see-through ghost overlay!
  const [bgOpacity, setBgOpacity] = useState(0); 
  const [showSlider, setShowSlider] = useState(false);
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

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: `rgba(10, 12, 20, ${bgOpacity / 100})`,
        backdropFilter: bgOpacity > 0 ? `blur(${Math.min(16, bgOpacity / 4)}px)` : 'none',
        WebkitBackdropFilter: bgOpacity > 0 ? `blur(${Math.min(16, bgOpacity / 4)}px)` : 'none',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
        transition: 'background-color 0.2s ease'
      }}
    >
      {/* 1. ULTRA-LIGHTWEIGHT TRANSPARENT DRAG HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: bgOpacity > 20 ? 'rgba(0,0,0,0.3)' : 'transparent',
          borderBottom: bgOpacity > 20 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          cursor: 'grab'
        }}
      >
        {/* Partner badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 6px #ef4444'
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 800, textShadow: '0 1px 2px #000' }}>
              {partnerName} {partnerEmoji}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#fda4af', opacity: 0.9 }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Transparency Slider Toggle & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Opacity Pill / Presets */}
          <button
            onClick={() => setBgOpacity(prev => (prev === 0 ? 35 : prev === 35 ? 70 : 0))}
            style={{
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              cursor: 'pointer',
              textShadow: '0 1px 2px #000',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Click to toggle: 0% Pure Ghost / 35% Frosted Glass / 70% Dark Smoke"
          >
            <span>👻 {bgOpacity === 0 ? 'Ghost 100%' : `${100 - bgOpacity}% Clear`}</span>
          </button>

          <button
            onClick={() => setShowSlider(s => !s)}
            style={{
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 700
            }}
            title="Adjust transparency slider"
          >
            <Sliders size={11} />
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Overlay"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* OPTIONAL OPACITY ADJUST SLIDER BAR */}
      {showSlider && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            background: 'rgba(0,0,0,0.65)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            fontSize: '10px'
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Tint:</span>
          <input
            type="range"
            min="0"
            max="85"
            value={bgOpacity}
            onChange={(e) => setBgOpacity(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#f43f5e', cursor: 'pointer', height: '3px' }}
          />
          <span style={{ color: '#fda4af', fontWeight: 700, minWidth: '32px' }}>
            {bgOpacity}%
          </span>
        </div>
      )}

      {/* 2. REAL-TIME FLOATING MESSAGES STREAM (SEETHRROUGH BUBBLES) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
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
              color: 'rgba(255,255,255,0.85)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              textShadow: '0 1px 3px #000'
            }}
          >
            💬 Waiting for {partnerName}'s messages...
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
                {/* Floating Avatar Badge */}
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: isMahad
                      ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
                      : 'linear-gradient(135deg, #ec4899, #e11d48)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 800,
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.6)'
                  }}
                >
                  {isMahad ? 'M' : 'I'}
                </div>

                {/* Truly Translucent Frosted Glass Message Bubble */}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '7px 11px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isMe
                      ? 'rgba(244, 63, 94, 0.38)'
                      : isMahad
                        ? 'rgba(30, 64, 175, 0.42)'
                        : 'rgba(190, 24, 93, 0.42)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: isMe
                      ? '1px solid rgba(244, 63, 94, 0.5)'
                      : isMahad
                        ? '1px solid rgba(147, 197, 253, 0.45)'
                        : '1px solid rgba(251, 113, 133, 0.45)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    wordBreak: 'break-word',
                    fontSize: '12px',
                    lineHeight: '1.35',
                    color: '#ffffff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.95)'
                  }}
                >
                  {!isMe && (
                    <div
                      style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        color: isMahad ? '#bfdbfe' : '#fbcfe8',
                        marginBottom: '1px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
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

      {/* 3. QUICK 1-TAP EMOJIS (TRANSPARENT BACKGROUND) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          backgroundColor: 'transparent'
        }}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSubmit(undefined, emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '15px',
              cursor: 'pointer',
              padding: '2px 4px',
              transition: 'transform 0.15s ease',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
            }}
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* 4. QUICK WHISPER INPUT (GLASS PILL) */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px 8px 8px',
          backgroundColor: 'transparent'
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
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '999px',
            padding: '6px 12px',
            fontSize: '11px',
            color: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            textShadow: '0 1px 2px #000'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          style={{
            width: '28px',
            height: '28px',
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
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
