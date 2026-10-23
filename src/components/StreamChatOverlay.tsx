import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { MessageSquare, Send, X, ExternalLink, Sparkles, Bell } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { firestoreDB } from '../firebase';
import { decryptMessage } from '../crypto';
import DesktopPiPChatWindow from './DesktopPiPChatWindow';

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

// Soft romantic 2-tone melodic chime (E5 -> A5) via Web Audio API
function playMessageChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880.00, now + 0.12); // A5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (e) {
    // Audio context may require prior user interaction
  }
}

export default function StreamChatOverlay({ currentUser, streamStartTime }: StreamChatOverlayProps) {
  const [toasts, setToasts] = useState<ChatToast[]>([]);
  const [allMessages, setAllMessages] = useState<ChatToast[]>([]);
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement | null>(null);

  const partnerName = currentUser === 'Mahad' ? 'Ifa' : 'Mahad';
  const partnerEmoji = partnerName === 'Mahad' ? '🌹' : '🌷';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      setIsPipSupported(true);
    }
  }, []);

  // Request native OS notification permissions
  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {}
    }
  }, []);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const q = query(
      collection(firestoreDB, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const mountTime = Date.now();

    const unsub = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const cutoff = streamStartTime > 0 ? Math.max(streamStartTime - 3000, now - 45000) : now - 30000;

      const newIncomingToasts: ChatToast[] = [];
      const incomingList: ChatToast[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        const createdAt = data.createdAt || 0;

        if (createdAt >= cutoff) {
          const rawContent = data.content || '';
          const cleanText = data.type === 'text' 
            ? (rawContent ? decryptMessage(rawContent) : '') 
            : data.type === 'image' 
              ? '📷 Sent a photo' 
              : data.type === 'sticker' 
                ? '🌸 Sent a sticker' 
                : data.type === 'gif' 
                  ? '✨ Sent a GIF' 
                  : '🎤 Sent a voice note';

          const item: ChatToast = {
            id,
            sender: data.sender || 'Mahad',
            content: cleanText,
            type: data.type || 'text',
            createdAt,
            expiresAt: createdAt + 7000
          };
          incomingList.push(item);

          if (!seenMsgIdsRef.current.has(id)) {
            seenMsgIdsRef.current.add(id);

            // Notify streamer if message is from the partner watching
            if (data.sender !== currentUser && createdAt > mountTime - 3000) {
              // 1. Soft audio chime
              playMessageChime();

              // 2. Native OS Notification when site tab is in the background or minimized
              if (
                typeof Notification !== 'undefined' &&
                Notification.permission === 'granted' &&
                document.visibilityState === 'hidden'
              ) {
                try {
                  const notif = new Notification(`${data.sender} ${data.sender === 'Mahad' ? '🌹' : '🌷'}`, {
                    body: cleanText,
                    icon: '/favicon.ico',
                    tag: id
                  });
                  notif.onclick = () => {
                    window.focus();
                    notif.close();
                  };
                } catch (e) {}
              }
            }

            newIncomingToasts.push(item);
          }
        }
      });

      // Update full message list for desktop overlay
      setAllMessages(incomingList.reverse());

      // Update transient toasts
      if (newIncomingToasts.length > 0) {
        setToasts((prev) => {
          const combined = [...newIncomingToasts.reverse(), ...prev];
          return combined.slice(0, 3);
        });
      }
    });

    return () => unsub();
  }, [streamStartTime, currentUser]);

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

  // Quick message send with EXACT firestore.rules message schema
  const handleSendMessage = async (e?: React.FormEvent, customContent?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const textToSend = (customContent !== undefined ? customContent : inputText).trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    const msgId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      await setDoc(doc(firestoreDB, 'messages', msgId), {
        id: msgId,
        sender: currentUser,
        type: 'text',
        content: textToSend,
        createdAt: Date.now(),
        isRead: false,
        reactions: []
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

  // Toggle Document Picture-in-Picture Always-On-Top Window
  const toggleDesktopOverlay = useCallback(async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    requestNotificationPermission();

    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      try {
        const pw = await (window as any).documentPictureInPicture.requestWindow({
          width: 380,
          height: 420
        });

        // Copy styles to ensure icons and fonts render
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join('');
            const styleEl = pw.document.createElement('style');
            styleEl.textContent = rules;
            pw.document.head.appendChild(styleEl);
          } catch (e) {
            if (sheet.href) {
              const linkEl = pw.document.createElement('link');
              linkEl.rel = 'stylesheet';
              linkEl.href = sheet.href;
              pw.document.head.appendChild(linkEl);
            }
          }
        });

        pw.document.title = `💬 Transparent Chat Overlay • ${partnerName} ${partnerEmoji}`;
        
        // Pure transparent root & body so the overlay floats seamlessly over desktop apps and games
        pw.document.documentElement.style.margin = '0';
        pw.document.documentElement.style.padding = '0';
        pw.document.documentElement.style.background = 'transparent';
        pw.document.documentElement.style.backgroundColor = 'transparent';
        pw.document.documentElement.style.overflow = 'hidden';

        pw.document.body.style.margin = '0';
        pw.document.body.style.padding = '0';
        pw.document.body.style.background = 'transparent';
        pw.document.body.style.backgroundColor = 'transparent';
        pw.document.body.style.overflow = 'hidden';

        pw.addEventListener('pagehide', () => {
          setPipWindow(null);
        });

        setPipWindow(pw);
      } catch (err) {
        console.warn('[StreamChat] Failed to open Document PiP:', err);
      }
    } else {
      // Fallback for browsers without Document PiP: prompt native notifications
      if (typeof Notification !== 'undefined') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification(`${partnerName} ${partnerEmoji}`, {
            body: `Desktop notifications enabled! Messages will pop up on your screen when you switch to other windows.`,
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, [pipWindow, requestNotificationPermission, partnerName, partnerEmoji]);

  // Listen to custom global toggle event from top bar
  useEffect(() => {
    const handleGlobalToggle = () => toggleDesktopOverlay();
    window.addEventListener('aim:toggle-desktop-overlay', handleGlobalToggle);
    return () => window.removeEventListener('aim:toggle-desktop-overlay', handleGlobalToggle);
  }, [toggleDesktopOverlay]);

  return (
    <>
      {/* 1. DOCUMENT PIP ALWAYS-ON-TOP DESKTOP WINDOW PORTAL */}
      {pipWindow &&
        createPortal(
          <DesktopPiPChatWindow
            currentUser={currentUser}
            messages={allMessages}
            onSendMessage={(text) => handleSendMessage(undefined, text)}
            onClose={() => {
              pipWindow.close();
              setPipWindow(null);
            }}
          />,
          pipWindow.document.body
        )}

      {/* 2. IN-PAGE STAGE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-end items-end p-3 sm:p-6 pb-20 sm:pb-24 overflow-hidden">
        {/* STACKED LIVE CHAT TOAST BUBBLES */}
        <div className="flex flex-col items-end gap-2.5 mb-2.5 max-w-[85vw] sm:max-w-sm w-full">
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
                  className={`pointer-events-auto cursor-pointer p-2.5 sm:p-3.5 rounded-[22px] sm:rounded-[24px] clay-card shadow-2xl backdrop-blur-xl border border-white/20 flex items-start gap-2.5 max-w-full sm:max-w-xs transition-transform hover:scale-102 active:scale-98 ${
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

        {/* BOTTOM RIGHT FLOATING CONTROLS: QUICK CHAT & DESKTOP OVERLAY */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Always-on-Top Desktop Overlay Pop-out Trigger */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springBezier}
            onClick={toggleDesktopOverlay}
            className={`px-3.5 py-2.5 rounded-full backdrop-blur-xl border shadow-xl text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all ${
              pipWindow
                ? 'bg-gradient-to-r from-pastel-pink-500 to-rose-600 text-white border-pastel-pink-400 shadow-rose-500/40'
                : 'bg-surface/90 dark:bg-black/85 border-pastel-pink-400/50 text-text-main hover:border-pastel-pink-400'
            }`}
            title="Pop-out Always-On-Top Desktop Chat Overlay (stays over games, movies, & desktop apps even when site is minimized)"
          >
            <ExternalLink className={`w-3.5 h-3.5 ${pipWindow ? 'text-white' : 'text-pastel-pink-400'}`} />
            <span className="hidden sm:inline">
              {pipWindow ? 'Desktop Overlay Active 🖥️' : 'Desktop Overlay 💬'}
            </span>
            <span className="sm:hidden">{pipWindow ? 'Overlay 🖥️' : 'Overlay 💬'}</span>
          </motion.button>

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

        {/* QUICK CHAT POPOVER FORM */}
        <div className="pointer-events-auto flex flex-col items-end gap-2 mt-2">
          <AnimatePresence>
            {isQuickChatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={springBezier}
                className="p-3 sm:p-3.5 rounded-[28px] clay-card bg-surface/95 dark:bg-black/90 backdrop-blur-2xl border border-pastel-pink-300/40 shadow-2xl flex flex-col gap-2.5 w-[calc(100vw-36px)] max-w-xs sm:w-80"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                  <span className="text-xs font-bold font-serif-italic text-text-main flex items-center gap-1">
                    <span>Whisper to {partnerName} {partnerEmoji}</span>
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
        </div>
      </div>
    </>
  );
}
