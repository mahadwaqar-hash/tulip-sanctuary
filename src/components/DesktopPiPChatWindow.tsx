import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Heart, Sparkles, MessageSquare, Radio } from 'lucide-react';

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
        backgroundColor: '#07080a',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* 1. COMPACT DRAG HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          padding: '10px 14px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          cursor: 'grab'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              boxShadow: '0 0 8px rgba(239,68,68,0.8)'
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>
            {partnerName} {partnerEmoji}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#fda4af',
              backgroundColor: 'rgba(244,63,94,0.15)',
              padding: '2px 7px',
              borderRadius: '999px',
              border: '1px solid rgba(244,63,94,0.3)',
              textTransform: 'uppercase'
            }}
          >
            Watching Live
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close Overlay"
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. REAL-TIME MESSAGES STREAM */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
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
              color: 'rgba(255,255,255,0.4)',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>💬</div>
            Waiting for {partnerName}'s messages...
            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>
              Always-on-top desktop overlay active
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
                  gap: '8px'
                }}
              >
                {/* Avatar Badge */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isMahad
                      ? 'linear-gradient(135deg, #3b82f6, #4f46e5)'
                      : 'linear-gradient(135deg, #ec4899, #e11d48)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                  }}
                >
                  {isMahad ? 'M' : 'I'}
                </div>

                {/* Message Bubble */}
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    backgroundColor: isMe
                      ? 'rgba(244,63,94,0.25)'
                      : isMahad
                        ? 'rgba(30,58,138,0.6)'
                        : 'rgba(136,19,55,0.6)',
                    border: isMe
                      ? '1px solid rgba(244,63,94,0.4)'
                      : isMahad
                        ? '1px solid rgba(96,165,250,0.4)'
                        : '1px solid rgba(251,113,133,0.4)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    wordBreak: 'break-word',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    color: '#f8fafc'
                  }}
                >
                  {!isMe && (
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: isMahad ? '#93c5fd' : '#fda4af',
                        marginBottom: '2px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {msg.sender}
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
          padding: '6px 12px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSubmit(undefined, emoji)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '17px',
              cursor: 'pointer',
              padding: '2px 4px',
              transition: 'transform 0.15s ease'
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
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid rgba(255,255,255,0.1)'
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
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px',
            padding: '7px 14px',
            fontSize: '12px',
            color: '#fff',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          style={{
            width: '32px',
            height: '32px',
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
            boxShadow: '0 2px 8px rgba(244,63,94,0.4)'
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
