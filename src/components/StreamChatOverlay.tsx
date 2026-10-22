import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { MessageSquare, Send, X, Heart, Sparkles, Smile } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestoreDB, fb } from '../firebase';
import { decryptMessage } from '../crypto';

const springBezier: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 24,
  mass: 0.8
};

interface ChatToast {
  id: string;
  sender: 'Mahad' | 'Ifa';
  content: string;
  type?: string;
  createdAt: number;
  expiresAt: number;
}

interface StreamChatOverlayProps {
  currentUser: 'Mahad' | 'Ifa';
  streamStartTime: number;
}

const QUICK_EMOJIS = ['❤️', '🥺', '😂', '🍿', '✨', '🌹', '🌷'];

export default function StreamChatOverlay({ currentUser, streamStartTime }: StreamChatOverlayProps) {
  const [toasts, setToasts] = useState<ChatToast[]>([]);
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const q = query(
      collection(firestoreDB, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const cutoff = streamStartTime > 0 ? streamStartTime - 2000 : now - 15000;

      const newIncoming: ChatToast[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        const createdAt = data.createdAt || 0;

        // Only pop up messages that occurred during or right around the stream
        if (createdAt >= cutoff && !seenMsgIdsRef.current.has(id)) {
          seenMsgIdsRef.current.add(id);

          const rawContent = data.content || '';
          const cleanText = data.type === 'text' 
            ? decryptMessage(rawContent) 
            : data.type === 'image' 
              ? '📷 Sent a photo' 
              : data.type === 'sticker' 
                ? '🌸 Sent a sticker' 
                : data.type === 'gif' 
                  ? '✨ Sent a GIF' 
                  : '🎤 Sent a voice note';

          newIncoming.push({
            id,
            sender: data.sender || 'Mahad',
            content: cleanText,
            type: data.type || 'text',
            createdAt,
            expiresAt: now + 7000 // 7 seconds lifetime
          });
        }
      });

      if (newIncoming.length > 0) {
        setToasts((prev) => {
          const combined = [...newIncoming.reverse(), ...prev];
          // Keep maximum 3 stacked bubbles visible at once
          return combined.slice(0, 3);
        });
      }
    });

    return () => unsub();
  }, [streamStartTime]);

  // Periodic cleaner for expiring toast bubbles
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setToasts((prev) => {
        const next = prev.filter((t) => t.expiresAt > now);
        return next.length === prev.length ? prev : next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Quick message send
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customContent !== undefined ? customContent : inputText).trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    const msgId = crypto.randomUUID();

    try {
      await fb.messages.add({
        id: msgId,
        sender: currentUser,
        type: 'text',
        content: textToSend,
        createdAt: Date.now()
      });

      if (customContent === undefined) {
        setInputText('');
      }
    } catch (err) {
      console.warn('[StreamChat] Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-end items-end p-4 sm:p-6 overflow-hidden">
      {/* 1. STACKED LIVE CHAT TOAST BUBBLES */}
      <div className="flex flex-col items-end gap-2.5 mb-3 max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const isMe = toast.sender === currentUser;
            const isMahad = toast.sender === 'Mahad';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88, y: -10 }}
                transition={springBezier}
                onClick={() => dismissToast(toast.id)}
                className={`pointer-events-auto cursor-pointer p-3 sm:p-3.5 rounded-[24px] clay-card shadow-2xl backdrop-blur-xl border border-white/20 flex items-start gap-2.5 max-w-[90%] sm:max-w-xs transition-transform hover:scale-102 active:scale-98 ${
                  isMahad 
                    ? 'bg-slate-900/90 text-white border-blue-400/40' 
                    : 'bg-rose-950/90 text-white border-rose-400/40'
                }`}
                style={{
                  boxShadow: isMahad
                    ? '0 10px 25px -5px rgba(37,99,235,0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
                    : '0 10px 25px -5px rgba(244,63,94,0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
                }}
              >
                {/* Floating Avatar Badge */}
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-md ${
                    isMahad
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      : 'bg-gradient-to-br from-pink-500 to-rose-600'
                  }`}
                >
                  {isMahad ? 'M' : 'I'}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-pastel-pink-300">
                      {toast.sender}
                    </span>
                    <span className="text-[10px]">{isMahad ? '🌹' : '🌷'}</span>
                  </div>
                  <p className="text-xs font-medium text-white/95 mt-0.5 break-words leading-snug">
                    {toast.content}
                  </p>
                </div>

                {/* Quick dismiss pill */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissToast(toast.id);
                  }}
                  className="p-1 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 2. QUICK CHAT TOGGLE & FLOATING INPUT PILL */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <AnimatePresence>
          {isQuickChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={springBezier}
              className="p-3 sm:p-3.5 rounded-[28px] clay-card bg-surface/95 dark:bg-black/90 backdrop-blur-2xl border border-pastel-pink-300/40 shadow-2xl flex flex-col gap-2.5 w-72 sm:w-80"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                <span className="text-xs font-bold font-serif-italic text-text-main flex items-center gap-1">
                  <span>Whisper to {currentUser === 'Mahad' ? 'Ifa 🌷' : 'Mahad 🌹'}</span>
                </span>
                <button
                  onClick={() => setIsQuickChatOpen(false)}
                  className="p-1 text-text-muted hover:text-text-main rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick One-Tap Emojis */}
              <div className="flex items-center justify-between px-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendMessage(undefined, emoji)}
                    className="p-1.5 text-base hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-surface-hover py-2 px-3 rounded-full text-xs text-text-main outline-none border border-border focus:border-pastel-pink-400 font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-2 rounded-full bg-pastel-pink-500 text-white disabled:opacity-40 hover:brightness-110 active:scale-90 transition-all cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Chat Bubble Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={springBezier}
          onClick={() => {
            setIsQuickChatOpen((prev) => !prev);
            setTimeout(() => inputRef.current?.focus(), 150);
          }}
          className="px-4 py-2.5 rounded-full bg-surface/90 dark:bg-black/85 backdrop-blur-xl border border-pastel-pink-400/50 shadow-xl text-text-main text-xs font-bold flex items-center gap-2 cursor-pointer hover:border-pastel-pink-400 hover:shadow-pastel-pink-500/20 active:scale-95 transition-all"
        >
          <MessageSquare className="w-4 h-4 text-pastel-pink-500" />
          <span>Quick Chat</span>
          <span className="w-2 h-2 rounded-full bg-pastel-pink-500 animate-pulse" />
        </motion.button>
      </div>
    </div>
  );
}
