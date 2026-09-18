import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Send, 
  SmilePlus, 
  Image as ImageIcon, 
  X, 
  Mic, 
  Square,
  Search, 
  Heart, 
  Sparkles, 
  Trash2, 
  Play, 
  Volume2,
  Film,
  Edit3,
  Check,
  CheckCheck,
  Reply,
  Pin,
  Copy,
  Loader2,
  Plus,
  RotateCcw,
  MoreHorizontal
} from 'lucide-react';
import { useFirestore, fb, useChatMessages, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PREMADE_GIFS_AND_STICKERS } from '../data/stickers';
import { encryptMessage, decryptMessage } from '../crypto';
import { getNetworkNow, formatMessageTime } from '../utils/timezone';

const springConfig: Transition = { type: 'spring', stiffness: 400, damping: 26 };

const DEFAULT_REACTIONS = ['❤️', '🌸', '✨', '🥺', '🤍', '🌙', '💍', '🥰'];

const EMOJI_PRESETS = [
  { name: '💕 Romance', emojis: ['❤️', '💖', '💋', '🥺', '💍', '🌹', '💌', '✨'] },
  { name: '🌸 Soft & Cute', emojis: ['✨', '🥰', '🌸', '🐰', '🥺', '🫶', '🤍', '🧸'] },
  { name: '🌙 Midnight', emojis: ['🌙', '🤍', '💫', '🧸', '🍷', '🕯️', '😴', '✨'] },
  { name: '😂 Laughs', emojis: ['😂', '🤣', '😭', '🤪', '🫣', '💀', '🔥', '👀'] },
];

const EMOJI_CATEGORIES = [
  {
    title: '❤️ Romance & Hearts',
    emojis: ['❤️', '💖', '💕', '💘', '💝', '💓', '💗', '🤍', '🖤', '💜', '🌹', '🌷', '💐', '💍', '💌', '💋', '🫶', '❤️‍🔥']
  },
  {
    title: '🥰 Sweet & Cuddly',
    emojis: ['🥰', '🥺', '😻', '😽', '🐰', '🐻', '🐥', '✨', '🌸', '🌙', '🧸', '🍼', '👉👈', '🕊️', '🧁', '🎀']
  },
  {
    title: '😂 Fun & Expressions',
    emojis: ['😂', '🤣', '🥹', '😭', '🤤', '🤭', '🤫', '😴', '🫠', '🤗', '🥳', '🫣', '🤪', '🤩', '💀', '👀']
  },
  {
    title: '🔥 Vibes & Sparks',
    emojis: ['🔥', '🌶️', '🫦', '👑', '🥂', '🍾', '🍓', '🍫', '🌟', '💫', '🌈', '⭐', '🔮', '💎', '🍷', '🎉']
  }
];

interface ChatSanctuaryProps {
  currentUser: 'Mahad' | 'Ifa';
}

export default function ChatSanctuary({ currentUser }: ChatSanctuaryProps) {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [stickerTab, setStickerTab] = useState<'gifs' | 'custom'>('gifs');
  const [isRecording, setIsRecording] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [showLovePrompts, setShowLovePrompts] = useState(false);
  const [showEmojiCustomizer, setShowEmojiCustomizer] = useState(false);
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [customReactions, setCustomReactions] = useState<string[]>(() => {
    try {
      const local = localStorage.getItem('tulip_custom_reactions');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_REACTIONS;
  });
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [loveBurstMsgId, setLoveBurstMsgId] = useState<string | null>(null);
  const [audioSpeeds, setAudioSpeeds] = useState<Record<string, number>>({});
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; id: string } | null>(null);

  // Expanded GIF Search & Pagination Engine
  const GIPHY_API_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh';
  const [gifQuery, setGifQuery] = useState('');
  const [gifCategory, setGifCategory] = useState('🔥 Trending');
  const [tenorGifs, setTenorGifs] = useState<string[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifOffset, setGifOffset] = useState(0);

  const GIF_CATEGORIES = [
    { label: '🔥 Trending', query: '' },
    { label: '❤️ Love & Hugs', query: 'love hug couple cute' },
    { label: '😂 Funny & Memes', query: 'funny meme reaction' },
    { label: '🐱 Cute Cats', query: 'cute cat kitty kitten' },
    { label: '💋 Kisses', query: 'kiss couple romance' },
    { label: '✨ Anime Love', query: 'anime couple romance' },
    { label: '🥺 Miss You', query: 'miss you sad cute' },
    { label: '🎉 Celebration', query: 'happy celebration yay' },
  ];

  const fetchGifs = useCallback(async (query: string, offset = 0, append = false) => {
    setGifLoading(true);
    try {
      const cleanQ = query.trim();
      const endpoint = cleanQ
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(cleanQ)}&limit=40&offset=${offset}`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=40&offset=${offset}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        const urls = data.data
          .map((g: any) => g.images?.fixed_width?.url || g.images?.fixed_width_small?.url || g.images?.original?.url)
          .filter(Boolean);
        setTenorGifs(prev => (append ? [...prev, ...urls] : urls));
        setGifOffset(offset + 40);
      }
    } catch (err) {
      console.error('GIF fetch failed:', err);
    } finally {
      setGifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifs('', 0, false);
  }, [fetchGifs]);

  const handleSearchGifs = (query: string) => {
    setGifQuery(query);
    if ((window as any).__gifTimer) clearTimeout((window as any).__gifTimer);
    (window as any).__gifTimer = setTimeout(() => {
      fetchGifs(query, 0, false);
    }, 350);
  };

  const handleSelectGifCategory = (cat: { label: string; query: string }) => {
    setGifCategory(cat.label);
    setGifQuery(cat.query);
    fetchGifs(cat.query, 0, false);
  };

  const handleLoadMoreGifs = () => {
    fetchGifs(gifQuery, gifOffset, true);
  };

  const handleQuickLove = async (msgId: string) => {
    setLoveBurstMsgId(msgId);
    if ('vibrate' in navigator) navigator.vibrate([30, 30]);
    handleReaction(msgId, '❤️');
    setTimeout(() => setLoveBurstMsgId(null), 1000);
  };

  const handleCopyText = (text: string, msgId: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedMsgId(msgId);
      if ('vibrate' in navigator) navigator.vibrate(30);
      setTimeout(() => setCopiedMsgId(null), 1800);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const toggleAudioSpeed = (msgId: string) => {
    setAudioSpeeds(prev => {
      const current = prev[msgId] || 1;
      const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
      const audioEl = document.querySelector(`[data-audio-id="${msgId}"]`) as HTMLAudioElement;
      if (audioEl) audioEl.playbackRate = next;
      return { ...prev, [msgId]: next };
    });
  };

  const SWEET_NOTHINGS = [
    "Thinking of you right now 💕",
    "I miss your smile & warmth 🌹",
    "Counting down the seconds until I hold you ✨",
    "You're my favorite person in the whole universe 🌷",
    "Sending you 1,000 warm kisses 💋",
    "I'm so lucky you're mine 💍",
    "Good morning my sunshine ☀️",
    "Goodnight my beautiful angel 🌙"
  ];

  const handleSendLovePrompt = async (text: string) => {
    setShowLovePrompts(false);
    if ('vibrate' in navigator) navigator.vibrate(40);
    const newCreatedAt = getSafeNewTimestamp();
    const msgId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await fb.messages.add({
      id: msgId,
      sender: currentUser,
      type: 'text',
      content: text,
      createdAt: newCreatedAt
    });

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleStartReply = (msg: any) => {
    setReplyingTo({
      id: msg.id,
      sender: msg.sender,
      content: msg.content || '',
      type: msg.type || 'text',
      mediaUrl: msg.mediaUrl || null
    });
    setSelectedMsgId(null);
    setTimeout(() => chatInputRef.current?.focus(), 80);
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(id);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  };

  const resizeImageToSticker = (dataUrl: string, maxSize = 256): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Live Settings
  const settingsArray = useFirestore<any>('userSettings', 'id', false) || [];
  const globalSettings = settingsArray.find(s => s.id === 'global') || {};

  // Sync custom reactions from Firestore if available
  useEffect(() => {
    if (globalSettings.customReactions && Array.isArray(globalSettings.customReactions) && globalSettings.customReactions.length > 0) {
      setCustomReactions(globalSettings.customReactions);
    }
  }, [globalSettings.customReactions]);

  const handleSaveCustomReactions = async (newReactions: string[]) => {
    setCustomReactions(newReactions);
    if ('vibrate' in navigator) navigator.vibrate(30);
    try {
      localStorage.setItem('tulip_custom_reactions', JSON.stringify(newReactions));
      await fb.userSettings.set('global', { customReactions: newReactions });
    } catch (e) {
      console.error('Failed to save reactions:', e);
    }
  };

  const [isEditingStart, setIsEditingStart] = useState(false);
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const startDateStr = globalSettings.relationshipStart || localStorage.getItem('tulip_relationship_start') || '2023-08-14';

  useEffect(() => {
    const updateLoveTimer = () => {
      const start = new Date(`${startDateStr}T00:00:00`).getTime();
      const now = getNetworkNow();
      const diff = Math.max(0, now - start);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      setTimeTogether({ days, hours, mins, secs });
    };

    updateLoveTimer();
    const interval = setInterval(updateLoveTimer, 1000);
    return () => clearInterval(interval);
  }, [startDateStr]);

  const handleSaveStartDate = async (newDate: string) => {
    localStorage.setItem('tulip_relationship_start', newDate);
    await fb.userSettings.set('global', { relationshipStart: newDate });
    setIsEditingStart(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageMsgRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Messages & Pagination
  const { messages: encryptedMessages, fetchMore, loadingMore, hasMore } = useChatMessages(30);
  const passcode = localStorage.getItem('tulip_custom_sanctuary_pass') || '311212';

  // Instant synchronous message decoding - zero flash, zero lag, 100% 60fps
  const messages = useMemo(() => {
    return encryptedMessages.map(msg => ({
      ...msg,
      content: msg.content ? decryptMessage(msg.content, passcode) : '',
      mediaUrl: msg.mediaUrl ? decryptMessage(msg.mediaUrl, passcode) : msg.mediaUrl
    }));
  }, [encryptedMessages, passcode]);

  // Auto-mark incoming messages as seen/read when viewing the chat
  useEffect(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    const unreadMessages = messages.filter(m => m.sender !== currentUser && !m.isRead);
    if (unreadMessages.length === 0) return;

    const markAsRead = async () => {
      const now = getNetworkNow();
      for (const m of unreadMessages) {
        try {
          await fb.messages.update(m.id, { isRead: true, readAt: now });
        } catch (e) {}
      }
    };

    const timer = setTimeout(markAsRead, 500);
    return () => clearTimeout(timer);
  }, [messages, currentUser]);

  // Listen for visibility change (e.g. switching back to tab/app) to mark as read
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const unreadMessages = messages.filter(m => m.sender !== currentUser && !m.isRead);
        if (unreadMessages.length > 0) {
          const now = getNetworkNow();
          unreadMessages.forEach(m => {
            fb.messages.update(m.id, { isRead: true, readAt: now }).catch(() => {});
          });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [messages, currentUser]);

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const topElementRef = useCallback((node: any) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, fetchMore]);

  const customStickers = useFirestore<any>('stickers', 'createdAt', true);

  // Auto-scroll logic: only scroll to bottom if we were already at bottom or if it's the initial load.
  // For simplicity, let's just scroll to bottom if the new message is from us.
  useEffect(() => {
    // Only scroll if we are not loading older messages
    if (!loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [encryptedMessages.length, loadingMore]);

  const typingStatuses = useFirestore<any>('typing', 'updatedAt', true);
  const otherUser = currentUser === 'Mahad' ? 'Ifa' : 'Mahad';
  const isOtherTyping = typingStatuses.some(
    t => t.id === otherUser && t.isTyping && (Date.now() - t.updatedAt < 5000)
  );

  // Synchronize timezone with user's settings so timestamps match their clock
  const mahadSettings = settingsArray.find(s => s.id === 'Mahad') || {};
  const ifaSettings = settingsArray.find(s => s.id === 'Ifa') || {};
  const userTz = currentUser === 'Mahad' 
    ? (mahadSettings.tz || localStorage.getItem('tulip_mahad_tz') || 'Asia/Karachi')
    : (ifaSettings.tz || localStorage.getItem('tulip_ifa_tz') || 'Europe/London');

  // Typing debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (val: string) => {
    setInputText(val);
    
    // Set typing to true
    fb.typing.set(currentUser, true);
    
    // Clear it after 3 seconds of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fb.typing.set(currentUser, false);
    }, 3000);
  };

  const getSafeNewTimestamp = () => {
    const now = getNetworkNow();
    const maxExistingTime = messages.reduce((max, m) => Math.max(max, Number(m.createdAt) || 0), 0);
    // If the latest message has the exact same millisecond or up to 2 seconds ahead, just nudge by 1ms
    if (maxExistingTime >= now && maxExistingTime <= now + 2000) {
      return maxExistingTime + 1;
    }
    return now;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      if (editingMsgId) {
        if (!editContent.trim()) return;
        await fb.messages.update(editingMsgId, { content: editContent.trim(), isEdited: true });
        setEditingMsgId(null);
        setEditContent('');
        return;
      }

      if (!inputText.trim()) return;

      const textToSend = inputText.trim();
      setInputText('');
      fb.typing.set(currentUser, false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      const replyData = replyingTo ? {
        id: replyingTo.id,
        sender: replyingTo.sender,
        content: replyingTo.content || '',
        type: replyingTo.type || 'text',
        mediaUrl: replyingTo.mediaUrl || null
      } : null;
      if (replyingTo) setReplyingTo(null);

      const newCreatedAt = getSafeNewTimestamp();
      const msgId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await fb.messages.add({
        id: msgId,
        sender: currentUser,
        type: 'text',
        content: textToSend,
        createdAt: newCreatedAt,
        ...(replyData ? { replyTo: replyData } : {})
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      console.error('[AIM] SEND FAILED:', err);
      alert(`Message failed to send: ${err?.message || String(err)}`);
    }
  };

  const handleSendImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        if ('vibrate' in navigator) navigator.vibrate(50);
        const newCreatedAt = getSafeNewTimestamp();
        const msgId = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const replyData = replyingTo ? {
          id: replyingTo.id,
          sender: replyingTo.sender,
          content: replyingTo.content || '',
          type: replyingTo.type || 'text',
          mediaUrl: replyingTo.mediaUrl || null
        } : null;
        if (replyingTo) setReplyingTo(null);

        await fb.messages.add({
          id: msgId,
          sender: currentUser,
          type: 'image',
          content: 'Sent a photo',
          mediaUrl: ev.target.result as string,
          createdAt: newCreatedAt,
          ...(replyData ? { replyTo: replyData } : {})
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendGifOrSticker = async (url: string, type: 'gif' | 'sticker') => {
    if ('vibrate' in navigator) navigator.vibrate(40);
    const newCreatedAt = getSafeNewTimestamp();
    const msgId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `gif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const replyData = replyingTo ? {
      id: replyingTo.id,
      sender: replyingTo.sender,
      content: replyingTo.content || '',
      type: replyingTo.type || 'text',
      mediaUrl: replyingTo.mediaUrl || null
    } : null;
    if (replyingTo) setReplyingTo(null);

    await fb.messages.add({
      id: msgId,
      sender: currentUser,
      type,
      content: url,
      createdAt: newCreatedAt,
      ...(replyData ? { replyTo: replyData } : {})
    });
    setShowStickerPicker(false);
  };

  const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        try {
          const compressed = await resizeImageToSticker(ev.target.result as string, 256);
          const stickerId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `stk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          await fb.stickers.add({
            id: stickerId,
            name: file.name || 'custom_sticker',
            dataUrl: compressed,
            createdAt: Date.now()
          });
          if ('vibrate' in navigator) navigator.vibrate([40, 40]);
        } catch (err: any) {
          console.error('Failed to upload custom sticker:', err);
          alert('Could not upload sticker: ' + (err?.message || String(err)));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Real Voice Notes (Using Base64 to bypass Firebase Storage Rule issues)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;
      
      // Determine optimal mimeType across iOS, Android, and Desktop
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        }
      }

      try {
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 });
      } catch (e) {
        try {
          mediaRecorderRef.current = new MediaRecorder(stream, { audioBitsPerSecond: 24000 });
        } catch (e2) {
          mediaRecorderRef.current = new MediaRecorder(stream);
        }
      }
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start(250); // 250ms chunks ensures Safari iOS commits data
      setIsRecording(true);
      setRecordingSeconds(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      if ('vibrate' in navigator) navigator.vibrate(50);
    } catch (err: any) {
      console.error("Mic error:", err);
      alert(`Could not start microphone: ${err.message || 'Please enable microphone permissions in your browser'}`);
    }
  };

  const handleCancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      try { mediaRecorderRef.current.stop(); } catch(e){}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const handleSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = async () => {
       setIsRecording(false);
       
       const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
       const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
       
       if (audioBlob.size === 0) {
         alert("Recording failed: 0 bytes captured. Please try again.");
         return;
       }
       
       const reader = new FileReader();
       reader.onloadend = async () => {
         try {
           const base64data = reader.result as string;
           const newCreatedAt = getSafeNewTimestamp();
           const msgId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
             ? crypto.randomUUID() 
             : `voice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

           const durationStr = recordingSeconds > 0 
             ? `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`
             : '0:05';

           const replyData = replyingTo ? {
             id: replyingTo.id,
             sender: replyingTo.sender,
             content: replyingTo.content || '',
             type: replyingTo.type || 'text',
             mediaUrl: replyingTo.mediaUrl || null
           } : null;
           if (replyingTo) setReplyingTo(null);

           await fb.messages.add({
             id: msgId,
             sender: currentUser,
             type: 'audio',
             content: `Voice note (${durationStr})`,
             mediaUrl: base64data,
             createdAt: newCreatedAt,
             ...(replyData ? { replyTo: replyData } : {})
           });

           setTimeout(() => {
             messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
           }, 50);
         } catch (err: any) {
           console.error("Audio save failed:", err);
           alert(`Failed to send voice note: ${err?.message || err}`);
         }
       };
       reader.readAsDataURL(audioBlob);
       
       if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
       }
       setRecordingSeconds(0);
    };

    try {
      mediaRecorderRef.current.stop();
    } catch (e) {
      console.error("Stop error:", e);
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    try {
      const targetMsg = messages.find(m => m.id === msgId);
      let currentReactions = targetMsg?.reactions;
      if (!currentReactions) {
        const fetched = await fb.messages.get(msgId);
        currentReactions = fetched?.reactions || [];
      }

      const updated = currentReactions.includes(emoji)
        ? currentReactions.filter(r => r !== emoji)
        : [...currentReactions, emoji];

      await fb.messages.update(msgId, { reactions: updated });
      if ('vibrate' in navigator) navigator.vibrate(30);
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    await fb.messages.delete(msgId);
  };

  // Filter messages by search query
  const filteredMessages = messages.filter(m => 
    !searchQuery.trim() || 
    (m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.sender && m.sender.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full md:rounded-[2rem] md:glass-panel md:shadow-2xl overflow-hidden md:border-2 md:border-pastel-pink-300/30 relative bg-surface/30 md:bg-transparent">
      
      {/* CHAT HEADER */}
      <div className="px-4 md:px-5 py-2 md:py-3 border-b border-pastel-pink-300/20 bg-surface/95 backdrop-blur-xl z-20 flex flex-row items-center justify-between gap-2 shadow-sm">
        
        {/* Left: User & Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-pastel-pink-300 to-pastel-pink-400 text-white flex items-center justify-center shadow-md font-serif-italic font-bold text-base md:text-lg">
              {currentUser === 'Mahad' ? 'M' : 'I'}
            </div>
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-charcoal absolute -bottom-0.5 -right-0.5 shadow-sm" />
          </div>

          <div className="flex flex-col overflow-hidden">
            <h2 className="text-xs md:text-sm font-bold text-text-main flex items-center gap-1 leading-tight truncate">
              <span>Chatting as <strong className="text-pastel-pink-400">{currentUser}</strong></span>
              <Heart className="w-3 h-3 text-pastel-pink-400 fill-pastel-pink-400 animate-pulse shrink-0" />
            </h2>
            <span className="text-[9px] md:text-[10px] text-text-muted font-medium truncate">
              Private 2-Player Haven
            </span>
          </div>
        </div>

        {/* Center: HOW LONG WE'VE BEEN IN LOVE BANNER (HIDDEN ON MOBILE) */}
        <div className="hidden lg:flex items-center justify-between md:justify-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-hover/80 border border-pastel-pink-300/30 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-pastel-pink-400 text-white flex items-center justify-center">
              <Heart className="w-3 h-3 fill-white" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">In Love For</span>
                <span className="text-[10px] text-pastel-pink-400 font-bold">✨</span>
              </div>
              <div className="flex items-baseline gap-1 text-text-main font-serif-italic font-bold text-xs sm:text-sm leading-tight">
                <span className="text-pastel-pink-400 text-sm sm:text-base font-sans font-extrabold">{timeTogether.days}</span>
                <span className="text-[11px] font-sans font-medium text-text-muted">days</span>
                <span className="text-pastel-pink-400 text-xs font-sans font-bold ml-1">{timeTogether.hours}h</span>
                <span className="text-pastel-pink-400 text-xs font-sans font-bold">{timeTogether.mins}m</span>
                <span className="text-pastel-pink-400 text-[10px] font-sans font-bold opacity-80">{timeTogether.secs}s</span>
              </div>
            </div>
          </div>

          {/* Edit Start Date Button / Modal Toggle */}
          {isEditingStart ? (
            <div className="flex items-center gap-1 ml-2">
              <input
                type="date"
                defaultValue={startDateStr}
                onChange={(e) => {
                  if (e.target.value) handleSaveStartDate(e.target.value);
                }}
                className="text-[10px] bg-surface p-1 rounded-md border border-pastel-pink-300 text-text-main outline-none"
              />
              <button
                type="button"
                onClick={() => setIsEditingStart(false)}
                className="p-1 rounded text-text-muted hover:text-text-main text-[10px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingStart(true)}
              className="p-1.5 text-text-muted hover:text-pastel-pink-400 rounded-full hover:bg-pastel-pink-100/10 transition-colors cursor-pointer ml-1"
              title="Change Anniversary / In Love Date"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setShowEmojiCustomizer(true)}
            className="p-2.5 rounded-full text-text-muted hover:bg-pastel-pink-400/20 hover:text-pastel-pink-400 transition-all cursor-pointer"
            title="Customize Reaction Emojis"
          >
            <SmilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2.5 rounded-full transition-all cursor-pointer ${
              showSearch ? 'bg-pastel-pink-400 text-white shadow-md' : 'text-text-muted hover:bg-pastel-pink-100/10 hover:text-pastel-pink-400'
            }`}
            title="Search Messages"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE LOVE TIMER TICKER STRIP (Visible on mobile & tablets < lg) */}
      <div className="lg:hidden flex items-center justify-between px-3.5 py-2 bg-surface-hover/90 border-b border-pastel-pink-300/20 backdrop-blur-md text-xs z-10 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-lg bg-pastel-pink-400 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Heart className="w-3 h-3 fill-white" />
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted shrink-0">In Love For:</span>
            <span className="text-pastel-pink-400 font-extrabold text-xs tracking-tight whitespace-nowrap">
              {timeTogether.days}d {timeTogether.hours}h {timeTogether.mins}m {timeTogether.secs}s
            </span>
          </div>
        </div>
        {isEditingStart ? (
          <div className="flex items-center gap-1 shrink-0">
            <input
              type="date"
              defaultValue={startDateStr}
              onChange={(e) => {
                if (e.target.value) handleSaveStartDate(e.target.value);
              }}
              className="text-[10px] bg-surface p-1 rounded-md border border-pastel-pink-300 text-text-main outline-none"
            />
            <button
              type="button"
              onClick={() => setIsEditingStart(false)}
              className="p-1 rounded text-text-muted hover:text-text-main text-[10px]"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingStart(true)}
            className="p-1 text-text-muted hover:text-pastel-pink-400 rounded-full cursor-pointer shrink-0"
            title="Change In Love Date"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* SEARCH BAR DROPDOWN */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-3 border-b border-pastel-pink-300/20 bg-surface-hover/80 backdrop-blur-md overflow-hidden"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-4 text-pastel-pink-400/50" />
              <input
                type="text"
                placeholder="Search words, memories, jokes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border-2 border-pastel-pink-200/50 rounded-full py-2 pl-10 pr-10 text-xs font-medium text-text-main outline-none focus:border-pastel-pink-400 transition-colors shadow-inner"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 text-text-muted hover:text-text-main text-xs cursor-pointer">
                  ✕
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PINNED MEMORY BANNER */}
      {(() => {
        const pinnedMsg = globalSettings.pinnedMessageId ? messages.find(m => m.id === globalSettings.pinnedMessageId) : null;
        if (!pinnedMsg) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 border-b border-pastel-pink-300/30 bg-surface-hover/95 backdrop-blur-xl flex items-center justify-between gap-3 text-xs z-10 shadow-xs"
          >
            <div
              onClick={() => scrollToMessage(pinnedMsg.id)}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer flex-1 group"
              title="Click to jump to pinned memory"
            >
              <div className="p-1.5 rounded-xl bg-pastel-pink-400 text-white shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                <Pin className="w-3.5 h-3.5 fill-white" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pastel-pink-400 flex items-center gap-1 leading-tight">
                  Pinned Memory <Sparkles className="w-2.5 h-2.5 inline" />
                </span>
                <span className="text-xs text-text-main truncate font-medium mt-0.5">
                  <strong className="text-pastel-pink-400">{pinnedMsg.sender}: </strong>
                  {pinnedMsg.type === 'text' && pinnedMsg.content}
                  {pinnedMsg.type === 'image' && '📷 Photo'}
                  {pinnedMsg.type === 'gif' && '✨ GIF'}
                  {pinnedMsg.type === 'sticker' && '🌸 Sticker'}
                  {pinnedMsg.type === 'audio' && '🎤 Voice Note'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                await fb.userSettings.set('global', { pinnedMessageId: null });
              }}
              className="p-1 rounded-full text-text-muted hover:text-red-400 hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
              title="Unpin Memory"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        );
      })()}

      {/* MESSAGE STREAM */}
      <div 
        onClick={(e) => { 
          const target = e.target as HTMLElement;
          if (!target.closest('[data-msg-bubble]') && !target.closest('[data-action-row]')) {
            setSelectedMsgId(null); 
          }
        }}
        className="flex-1 bg-gradient-to-b from-transparent to-pastel-pink-100/10 dark:to-pastel-pink-900/10 overflow-y-auto px-3 py-4 md:p-6 scroll-smooth flex flex-col gap-3 relative"
      >
        <div ref={topElementRef} className="h-6 w-full shrink-0 flex items-center justify-center">
          {loadingMore && <div className="text-pastel-pink-400 font-bold text-xs animate-pulse">Loading older memories...</div>}
        </div>
        {filteredMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <motion.div 
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-pastel-pink-200 to-pastel-pink-400 text-white flex items-center justify-center mb-4 shadow-lg glow-rose-sm"
            >
              <Heart className="w-8 h-8 md:w-10 md:h-10 fill-white" />
            </motion.div>
            <span className="font-fairytale text-3xl sm:text-4xl text-pastel-pink-400 lowercase mb-1">
              our secret conversation
            </span>
            <h3 className="font-serif-italic text-xl sm:text-3xl font-bold text-text-main">
              {currentUser === 'Mahad' ? 'Mahad loves Ifa' : 'Ifa loves Mahad'}
            </h3>
            <p className="text-xs text-text-muted mt-2 font-medium max-w-xs">
              Every thought, silly joke, late night secret, and cute GIF lives right here safely between us.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isMe = msg.sender === currentUser;
            const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
            const nextMsg = index < filteredMessages.length - 1 ? filteredMessages[index + 1] : null;
            
            const isFirstInCluster = prevMsg?.sender !== msg.sender;
            const isLastInCluster = nextMsg?.sender !== msg.sender;
            const showName = isFirstInCluster;
            
            const isSelected = selectedMsgId === msg.id;

            let corners = 'rounded-[1.5rem]';
            if (isMe) {
              corners = `rounded-[1.5rem] ${!isFirstInCluster ? 'rounded-tr-[4px]' : ''} ${!isLastInCluster ? 'rounded-br-[4px]' : 'rounded-br-[2px]'}`;
            } else {
              corners = `rounded-[1.5rem] ${!isFirstInCluster ? 'rounded-tl-[4px]' : ''} ${!isLastInCluster ? 'rounded-bl-[4px]' : 'rounded-bl-[2px]'}`;
            }

            return (
              <motion.div
                key={msg.id}
                id={`msg-${msg.id}`}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={springConfig}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group mb-${isLastInCluster ? '2' : '0.5'} transition-all duration-500 rounded-3xl ${
                  highlightedMsgId === msg.id ? 'ring-2 ring-pastel-pink-400 bg-pastel-pink-400/20 p-1.5' : ''
                }`}
              >
                <div className={`max-w-[88%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}>
                  
                  {/* Sender Tag (Only show for first in cluster) */}
                  {showName && (
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 px-1">
                      {msg.sender}
                    </span>
                  )}

                  {/* Swipeable Message Bubble with 100% Reliable Touch + Mouse Swipe */}
                  <motion.div
                    data-msg-bubble="true"
                    drag="x"
                    dragDirectionLock
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.35}
                    onDragEnd={(_e, info) => {
                      if (Math.abs(info.offset.x) > 35) {
                        handleStartReply(msg);
                        if ('vibrate' in navigator) navigator.vibrate([25, 25]);
                      }
                    }}
                    onTouchStart={(e) => {
                      touchStartRef.current = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                        id: msg.id
                      };
                    }}
                    onTouchEnd={(e) => {
                      if (!touchStartRef.current || touchStartRef.current.id !== msg.id) return;
                      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
                      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
                      touchStartRef.current = null;
                      if (Math.abs(deltaX) > 35 && Math.abs(deltaY) < 55) {
                        handleStartReply(msg);
                        if ('vibrate' in navigator) navigator.vibrate([25, 25]);
                      }
                    }}
                    style={{ touchAction: 'pan-y' }}
                    className="relative group/bubble flex flex-col cursor-grab active:cursor-grabbing"
                  >
                    {/* Swipe-to-Reply Hint Indicator */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 ${
                        isMe ? '-left-8' : '-right-8'
                      } text-pastel-pink-400 opacity-0 group-active/bubble:opacity-80 transition-opacity pointer-events-none`}
                    >
                      <Reply className="w-5 h-5" />
                    </div>

                    {/* Reply Quoted Preview Block (Discord / WhatsApp Style) */}
                    {msg.replyTo && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToMessage(msg.replyTo.id);
                        }}
                        className={`mb-1.5 px-3 py-1.5 rounded-2xl border-l-4 border-pastel-pink-400 text-xs cursor-pointer hover:opacity-90 transition-opacity flex flex-col select-none max-w-full ${
                          isMe
                            ? 'bg-black/25 text-white shadow-sm'
                            : 'bg-surface-hover/80 text-text-main border border-border/40 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold text-pastel-pink-400 text-[11px] leading-tight">
                          <Reply className="w-3 h-3 rotate-180 inline shrink-0" />
                          <span>{msg.replyTo.sender}</span>
                        </div>
                        <span className="truncate text-[12px] mt-0.5 max-w-[220px] sm:max-w-xs font-normal opacity-90">
                          {msg.replyTo.type === 'text' && (msg.replyTo.content || 'Message')}
                          {msg.replyTo.type === 'image' && '📷 Photo'}
                          {msg.replyTo.type === 'gif' && '✨ GIF'}
                          {msg.replyTo.type === 'sticker' && '🌸 Sticker'}
                          {msg.replyTo.type === 'audio' && '🎤 Voice Note'}
                        </span>
                      </div>
                    )}

                    {msg.type === 'text' && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMsgId(isSelected ? null : msg.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleQuickLove(msg.id);
                        }}
                        className={`px-5 py-3.5 shadow-md font-medium text-[15px] leading-relaxed transition-all cursor-pointer relative select-text ${corners} ${
                          isMe
                            ? 'bubble-me-gradient chat-text-crisp font-semibold shadow-pastel-pink-400/20'
                            : 'bubble-other-themed font-medium'
                        }`}
                      >
                        {loveBurstMsgId === msg.id && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1.8, 0], opacity: [0, 1, 0] }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                          >
                            <Heart className="w-12 h-12 fill-red-500 text-red-500 drop-shadow-2xl" />
                          </motion.div>
                        )}
                        {msg.content}
                      </div>
                    )}

                    {(msg.type === 'image' || msg.type === 'gif') && (
                      <div 
                        onClick={() => setPreviewImage(msg.mediaUrl || msg.content)}
                        className={`${corners} overflow-hidden border border-border/60 shadow-md cursor-pointer hover:opacity-95 transition-opacity max-w-xs sm:max-w-sm`}
                      >
                        <img src={msg.mediaUrl || msg.content} alt="media" className="w-full max-h-72 object-cover dark:mix-blend-screen" />
                      </div>
                    )}

                    {msg.type === 'sticker' && (
                      <div className="p-1">
                        <img
                          src={msg.content}
                          alt="sticker"
                          className="w-36 h-36 object-contain drop-shadow-xl hover:scale-105 transition-transform dark:mix-blend-screen"
                        />
                      </div>
                    )}

                    {msg.type === 'audio' && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMsgId(isSelected ? null : msg.id);
                        }}
                        className={`px-3 py-2 flex items-center gap-2 shadow-md cursor-pointer ${corners} ${
                          isMe
                            ? 'bubble-me-gradient text-white'
                            : 'bubble-other-themed'
                        }`}
                      >
                        <audio
                          controls
                          data-audio-id={msg.id}
                          src={msg.mediaUrl}
                          className="h-10 w-44 sm:w-48 outline-none"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAudioSpeed(msg.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-black/25 hover:bg-black/35 text-white text-[10px] font-extrabold uppercase tracking-wider transition-colors shrink-0"
                          title="Playback Speed"
                        >
                          {audioSpeeds[msg.id] || 1}x
                        </button>
                      </div>
                    )}
                  </motion.div>

                  {/* Reaction Badges on Message */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1 px-1 flex-wrap">
                      {msg.reactions.map((r: string, i: number) => (
                        <span
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReaction(msg.id, r);
                          }}
                          className="text-xs bg-surface-hover border border-border px-2 py-0.5 rounded-full shadow-2xs cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick Reaction Popup Drawer (Opens when tapped or clicked React) */}
                  <AnimatePresence>
                    {(isSelected || hoveredMsgId === msg.id) && (
                      <motion.div
                        data-action-row="true"
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`mt-1.5 flex items-center gap-1 bg-surface/98 backdrop-blur-2xl border border-pastel-pink-300/50 px-2.5 py-1 rounded-full shadow-xl z-30 max-w-[calc(100vw-32px)] overflow-x-auto`}
                      >
                        {customReactions.slice(0, 8).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReaction(msg.id, emoji);
                              setSelectedMsgId(null);
                            }}
                            className="text-base sm:text-lg hover:scale-130 active:scale-90 transition-transform cursor-pointer px-1 py-0.5"
                            title={`React ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}

                        {/* + Customize Emojis Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEmojiCustomizer(true);
                            setSelectedMsgId(null);
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-pastel-pink-400/20 hover:bg-pastel-pink-400 text-pastel-pink-400 hover:text-white transition-all text-xs font-extrabold shrink-0 cursor-pointer ml-0.5"
                          title="Customize reaction emojis"
                        >
                          +
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Interactive Action Row (Always Visible & 100% Functional!) */}
                  <div data-action-row="true" className="flex items-center gap-1.5 mt-1.5 px-1 flex-wrap">
                    <span className="text-[10px] text-text-muted font-medium mr-0.5">
                      {formatMessageTime(msg.createdAt, userTz)}
                    </span>
                    {msg.isEdited && (
                      <span className="text-[9px] text-pastel-pink-400 font-medium italic mr-0.5">
                        (edited)
                      </span>
                    )}

                    {/* Seen / Just Read Status */}
                    {isMe && (
                      <span 
                        className="flex items-center gap-0.5 text-[10px] select-none mr-1"
                        title={msg.isRead ? (msg.readAt ? `Read at ${formatMessageTime(msg.readAt, userTz)}` : 'Seen') : 'Sent'}
                      >
                        {msg.isRead ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-pastel-pink-400 stroke-[2.5]" />
                            <span className="text-[9.5px] text-pastel-pink-400 font-bold tracking-tight">
                              {msg.readAt && (getNetworkNow() - msg.readAt < 120 * 1000)
                                ? 'Just read'
                                : msg.readAt
                                  ? `Seen ${formatMessageTime(msg.readAt, userTz)}`
                                  : 'Seen'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-text-muted/60 stroke-[2]" />
                            <span className="text-[9px] text-text-muted/60 font-medium">Sent</span>
                          </>
                        )}
                      </span>
                    )}

                    {/* 1-Tap Reply Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartReply(msg);
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-text-muted hover:text-pastel-pink-400 bg-surface/80 hover:bg-surface border border-border/70 hover:border-pastel-pink-400 px-2.5 py-0.5 rounded-full transition-all cursor-pointer active:scale-95 shadow-2xs group/replybtn select-none"
                      title="Reply to this message"
                    >
                      <Reply className="w-3.5 h-3.5 group-hover/replybtn:-translate-x-0.5 transition-transform" />
                      <span>Reply</span>
                    </button>

                    {/* 1-Tap React Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMsgId(isSelected ? null : msg.id);
                      }}
                      className={`flex items-center gap-1 text-[11px] font-bold transition-all px-2.5 py-0.5 rounded-full border cursor-pointer active:scale-95 shadow-2xs select-none ${
                        isSelected
                          ? 'bg-pastel-pink-400 text-white border-pastel-pink-400 shadow-xs'
                          : 'text-text-muted hover:text-pastel-pink-400 bg-surface/80 hover:bg-surface border-border/70 hover:border-pastel-pink-400'
                      }`}
                      title="Open reaction drawer"
                    >
                      <SmilePlus className="w-3.5 h-3.5" />
                      <span>React</span>
                    </button>

                    {/* Copy Text Button */}
                    {msg.type === 'text' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(msg.content, msg.id);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-pastel-pink-400 bg-surface/80 hover:bg-surface border border-border/70 hover:border-pastel-pink-400 px-2 py-0.5 rounded-full transition-all cursor-pointer active:scale-95 shadow-2xs select-none"
                        title="Copy text"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Copy</span>
                      </button>
                    )}

                    {/* Pin / Unpin Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isPinned = globalSettings.pinnedMessageId === msg.id;
                        fb.userSettings.set('global', { pinnedMessageId: isPinned ? null : msg.id });
                      }}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 shadow-2xs select-none ${
                        globalSettings.pinnedMessageId === msg.id
                          ? 'text-pastel-pink-400 bg-pastel-pink-400/15 border-pastel-pink-400/50'
                          : 'text-text-muted hover:text-pastel-pink-400 bg-surface/80 hover:bg-surface border-border/70 hover:border-pastel-pink-400'
                      }`}
                      title={globalSettings.pinnedMessageId === msg.id ? 'Unpin Memory' : 'Pin Memory'}
                    >
                      <Pin className="w-3 h-3" />
                      <span className="hidden sm:inline">{globalSettings.pinnedMessageId === msg.id ? 'Pinned' : 'Pin'}</span>
                    </button>

                    {/* Edit Button */}
                    {isMe && msg.type === 'text' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMsgId(msg.id);
                          setEditContent(msg.content);
                        }}
                        className="text-text-muted/70 hover:text-pastel-pink-400 p-1 rounded-full cursor-pointer transition-colors"
                        title="Edit message"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Button */}
                    {isMe && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(msg.id);
                        }}
                        className="text-text-muted/70 hover:text-red-400 p-1 rounded-full cursor-pointer transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {isOtherTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-text-muted text-xs px-2 py-1"
          >
            <span className="w-2 h-2 rounded-full bg-pastel-pink-400 animate-pulse" />
            <span className="font-medium italic">{otherUser} is typing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* RECORDING PULSE */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-3 bg-pastel-pink-400 text-white flex items-center justify-between text-xs font-bold"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>Recording sweet voice note...</span>
          </div>
          <Volume2 className="w-4 h-4 animate-bounce" />
        </motion.div>
      )}

      {/* INPUT BAR */}
      <div className="p-2 md:p-4 shrink-0 bg-transparent md:bg-surface/90 md:backdrop-blur-2xl md:border-t md:border-border z-20 w-full relative mb-1 md:mb-0">
        
        {/* Reply Preview Banner (Discord / WhatsApp Style) */}
        <AnimatePresence>
          {replyingTo && !editingMsgId && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="mb-2 px-4 py-2 rounded-2xl bg-surface/95 backdrop-blur-2xl border border-pastel-pink-300/40 shadow-lg flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-1.5 rounded-xl bg-pastel-pink-400 text-white shrink-0 shadow-xs">
                  <Reply className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-[11px] font-bold text-pastel-pink-400 leading-tight">
                    Replying to {replyingTo.sender}
                  </span>
                  <span className="text-xs text-text-muted truncate max-w-xs sm:max-w-md font-medium">
                    {replyingTo.type === 'text' && (replyingTo.content || 'Message')}
                    {replyingTo.type === 'image' && '📷 Photo'}
                    {replyingTo.type === 'gif' && '✨ GIF'}
                    {replyingTo.type === 'sticker' && '🌸 Sticker'}
                    {replyingTo.type === 'audio' && '🎤 Voice Note'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-full text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
                title="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SWEET NOTHINGS / ROMANTIC QUICK-SEND POPUP */}
        <AnimatePresence>
          {showLovePrompts && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-[80px] left-3 right-3 sm:left-6 sm:right-auto sm:w-96 bg-surface/98 backdrop-blur-2xl border border-pastel-pink-300/40 rounded-[2rem] p-4 shadow-2xl z-30 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-bold font-serif-italic text-text-main flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pastel-pink-400 fill-pastel-pink-400 animate-pulse" /> Sweet Love Sparks
                </span>
                <button
                  type="button"
                  onClick={() => setShowLovePrompts(false)}
                  className="p-1 rounded-full text-text-muted hover:text-text-main cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {SWEET_NOTHINGS.map((phrase, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendLovePrompt(phrase)}
                    className="w-full text-left p-2.5 rounded-xl bg-surface-hover/70 hover:bg-pastel-pink-400/15 hover:border-pastel-pink-400 border border-border/40 text-xs font-medium text-text-main transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>{phrase}</span>
                    <Send className="w-3 h-3 text-pastel-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-1 md:p-1.5 border border-pastel-pink-300/40 bg-surface/95 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center relative z-20 overflow-hidden">
          
          {editingMsgId ? (
            <div className="w-full flex items-center gap-2 px-3 py-1.5 h-[42px] md:h-[46px]">
              <div className="text-[11px] font-bold text-pastel-pink-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Editing
              </div>
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 bg-surface-hover/50 rounded-full py-1.5 px-3 outline-none text-sm font-medium text-text-main focus:border-pastel-pink-400 border border-transparent transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setEditingMsgId(null); setEditContent(''); }}
                  className="p-2 text-text-muted hover:text-red-400 cursor-pointer"
                  title="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={!editContent.trim()}
                  className="px-4 py-1.5 rounded-full bg-pastel-pink-400 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  Save
                </button>
              </form>
            </div>
          ) : isRecording ? (
            <div className="w-full flex items-center justify-between px-3 py-1.5 h-[42px] md:h-[46px]">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <span className="relative flex h-3 w-3 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Recording... {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendRecording}
                  className="px-4 py-1.5 rounded-full bg-pastel-pink-400 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="w-full flex items-center gap-1">
              
              {/* Sweet Nothings / Romance Sparks Popover Toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowLovePrompts(!showLovePrompts);
                  setShowStickerPicker(false);
                }}
                className={`p-2.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  showLovePrompts ? 'bg-pastel-pink-400 text-white shadow-md' : 'text-text-muted hover:bg-pastel-pink-400/20 hover:text-pastel-pink-400'
                }`}
                title="Sweet Love Prompts"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>

              {/* Sticker / GIF Picker Toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowStickerPicker(!showStickerPicker);
                  setShowLovePrompts(false);
                }}
                className={`p-2.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  showStickerPicker ? 'bg-pastel-pink-400 text-white shadow-md' : 'text-text-muted hover:bg-pastel-pink-400/20 hover:text-pastel-pink-400'
                }`}
                title="GIFs & Stickers"
              >
                <SmilePlus className="w-5 h-5 md:w-5 md:h-5" />
              </button>

              {/* Photo Attachment */}
              <input
                type="file"
                ref={imageMsgRef}
                className="hidden"
                accept="image/*"
                onChange={handleSendImage}
              />
              <button
                type="button"
                onClick={() => imageMsgRef.current?.click()}
                className="p-2.5 rounded-full text-text-muted hover:bg-pastel-pink-400/20 hover:text-pastel-pink-400 transition-colors cursor-pointer shrink-0"
                title="Send Photo"
              >
                <ImageIcon className="w-5 h-5 md:w-5 md:h-5" />
              </button>

              {/* Main Input Field */}
              <input
                ref={chatInputRef}
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.sender}...` : `Message ${currentUser === 'Mahad' ? 'Ifa' : 'Mahad'}...`}
                className="flex-1 bg-transparent py-2.5 px-2 outline-none transition-all text-[15px] font-medium text-text-main placeholder:text-text-muted/60 min-w-0"
              />

              {/* Voice Note Toggle Button */}
              <button
                type="button"
                onClick={handleStartRecording}
                className="p-3 rounded-full transition-all cursor-pointer select-none touch-none flex items-center justify-center text-text-muted hover:bg-pastel-pink-400/20 hover:text-pastel-pink-400 shrink-0"
                title="Record Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 rounded-full bg-pastel-pink-400 text-white shadow-md disabled:opacity-40 hover:bg-pastel-pink-300 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </form>
          )}
        </div>

        {/* STICKER & GIF VAULT POPUP */}
        <AnimatePresence>
          {showStickerPicker && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={springConfig}
              className="absolute bottom-[85px] left-3 right-3 sm:left-4 sm:right-4 bg-surface/98 backdrop-blur-2xl border border-border rounded-[2.5rem] p-5 md:p-6 shadow-2xl z-30"
            >
              {/* Header with Tabs */}
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStickerTab('gifs')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      stickerTab === 'gifs'
                        ? 'bg-pastel-pink-400 text-white shadow-sm'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" /> All GIFs
                  </button>
                  <button
                    type="button"
                    onClick={() => setStickerTab('custom')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      stickerTab === 'custom'
                        ? 'bg-pastel-pink-400 text-white shadow-sm'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> My Stickers
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {stickerTab === 'custom' && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] bg-pastel-pink-400 text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider hover:bg-pastel-pink-300 transition-colors cursor-pointer"
                    >
                      + Upload PNG
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowStickerPicker(false)}
                    className="p-1 rounded-full text-text-muted hover:text-text-main cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleCustomStickerUpload}
              />

              {/* TAB 1: INFINITE GIPHY GIFS */}
              {stickerTab === 'gifs' && (
                <div className="flex flex-col gap-3">
                  {/* Search Bar with live loader */}
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 absolute left-3.5 text-text-muted" />
                    <input
                      type="text"
                      value={gifQuery}
                      placeholder="Search all GIFs (e.g. hug, love, dance, cat, meme...)"
                      onChange={(e) => handleSearchGifs(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl py-2 pl-10 pr-10 text-xs font-medium text-text-main outline-none focus:border-pastel-pink-400 shadow-inner"
                    />
                    {gifLoading ? (
                      <Loader2 className="w-4 h-4 absolute right-3.5 text-pastel-pink-400 animate-spin" />
                    ) : gifQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setGifQuery('');
                          fetchGifs('', 0, false);
                        }}
                        className="absolute right-3 text-text-muted hover:text-text-main text-xs p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {GIF_CATEGORIES.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => handleSelectGifCategory(cat)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                          gifCategory === cat.label
                            ? 'bg-pastel-pink-400 text-white shadow-xs'
                            : 'bg-surface-hover/80 text-text-muted hover:text-text-main hover:bg-surface-hover'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* GIF Grid with Expanded Height */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {tenorGifs.map((gifUrl: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => handleSendGifOrSticker(gifUrl, 'gif')}
                        className="aspect-square rounded-2xl overflow-hidden border border-border/50 hover:border-pastel-pink-400 cursor-pointer hover:scale-105 transition-all shadow-sm bg-surface-hover/40 group relative"
                      >
                        <img src={gifUrl} alt="gif" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}

                    {tenorGifs.length === 0 && !gifLoading && (
                      <div className="col-span-full py-10 text-center text-text-muted text-xs">
                        No GIFs found for "{gifQuery}". Try another search term!
                      </div>
                    )}

                    {/* Load More Button */}
                    {tenorGifs.length > 0 && (
                      <div className="col-span-full pt-2 pb-1 flex justify-center">
                        <button
                          type="button"
                          onClick={handleLoadMoreGifs}
                          disabled={gifLoading}
                          className="px-5 py-2 rounded-full bg-surface-hover border border-border text-xs font-bold text-text-main hover:border-pastel-pink-400 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          {gifLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-pastel-pink-400" /> Loading more...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-pastel-pink-400" /> Load More GIFs
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOM UPLOADED STICKERS */}
              {stickerTab === 'custom' && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {customStickers.map((stk) => (
                    <motion.button
                      key={stk.id}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSendGifOrSticker(stk.dataUrl, 'sticker')}
                      className="aspect-square bg-surface-hover rounded-2xl p-2 border border-border hover:border-pastel-pink-400 flex items-center justify-center cursor-pointer"
                    >
                      <img src={stk.dataUrl} alt={stk.name} className="w-full h-full object-contain" />
                    </motion.button>
                  ))}
                  {customStickers.length === 0 && (
                    <div className="col-span-full py-8 text-center text-text-muted text-xs font-medium">
                      Your custom sticker drawer is empty. Click <span className="text-pastel-pink-400 font-bold">+ Upload PNG</span> to add transparent stickers!
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden glass-panel border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={previewImage} alt="preview" className="max-h-[85vh] object-contain" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOMIZE QUICK REACTION EMOJIS MODAL */}
      <AnimatePresence>
        {showEmojiCustomizer && (
          <div
            onClick={() => setShowEmojiCustomizer(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-[2.5rem] bg-surface/98 backdrop-blur-2xl border border-pastel-pink-300/40 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-pastel-pink-400 text-white shadow-sm">
                    <SmilePlus className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-text-main leading-tight flex items-center gap-1.5">
                      Customize Emoji Reactions <Sparkles className="w-3.5 h-3.5 text-pastel-pink-400" />
                    </h3>
                    <p className="text-xs text-text-muted">
                      Pick up to 8 of your favorite emojis for 1-tap reactions
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmojiCustomizer(false)}
                  className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-surface-hover cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Reaction Bar Preview */}
              <div className="flex flex-col gap-1.5 bg-surface-hover/70 p-3.5 rounded-2xl border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-main">Active Reaction Row</span>
                  <span className="text-[11px] font-semibold text-pastel-pink-400">
                    {customReactions.length} / 8 Emojis
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap min-h-[48px] p-2 bg-surface/90 rounded-xl border border-border/60">
                  {customReactions.map((emoji, idx) => (
                    <div
                      key={idx}
                      className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-surface-hover border border-pastel-pink-300/30 text-xl shadow-xs"
                    >
                      <span>{emoji}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = customReactions.filter((_, i) => i !== idx);
                          handleSaveCustomReactions(next.length > 0 ? next : ['❤️']);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-85 hover:opacity-100 shadow-xs cursor-pointer"
                        title="Remove emoji"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {customReactions.length === 0 && (
                    <span className="text-xs text-text-muted italic">No emojis selected. Pick some below!</span>
                  )}
                </div>
              </div>

              {/* Add Custom Emoji / Text Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Add Any Emoji or Symbol
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customEmojiInput}
                    onChange={(e) => setCustomEmojiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!customEmojiInput.trim()) return;
                        if (customReactions.length >= 8) {
                          alert('Reaction bar is full (max 8). Remove one first!');
                          return;
                        }
                        const newEmoji = customEmojiInput.trim();
                        if (!customReactions.includes(newEmoji)) {
                          handleSaveCustomReactions([...customReactions, newEmoji]);
                        }
                        setCustomEmojiInput('');
                      }
                    }}
                    placeholder="Paste or type any emoji..."
                    className="flex-1 bg-surface-hover/60 border border-border rounded-xl px-3 py-2 text-sm text-text-main outline-none focus:border-pastel-pink-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customEmojiInput.trim()) return;
                      if (customReactions.length >= 8) {
                        alert('Reaction bar is full (max 8). Remove one first!');
                        return;
                      }
                      const newEmoji = customEmojiInput.trim();
                      if (!customReactions.includes(newEmoji)) {
                        handleSaveCustomReactions([...customReactions, newEmoji]);
                      }
                      setCustomEmojiInput('');
                    }}
                    className="px-4 py-2 rounded-xl bg-pastel-pink-400 text-white text-xs font-bold hover:bg-pastel-pink-300 transition-colors cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Quick Couple Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EMOJI_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSaveCustomReactions(preset.emojis)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-hover/60 hover:bg-pastel-pink-400/15 border border-border/70 hover:border-pastel-pink-400 transition-all cursor-pointer text-center"
                    >
                      <span className="text-xs font-bold text-text-main">{preset.name}</span>
                      <span className="text-sm tracking-widest">{preset.emojis.slice(0, 4).join('')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorized Emoji Palette */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Pick from Curated Palettes
                </label>
                <div className="flex flex-col gap-3">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.title} className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-text-muted">{cat.title}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              if (customReactions.includes(emoji)) {
                                handleSaveCustomReactions(customReactions.filter(e => e !== emoji));
                              } else {
                                if (customReactions.length >= 8) {
                                  alert('Maximum 8 emojis reached. Remove one first!');
                                  return;
                                }
                                handleSaveCustomReactions([...customReactions, emoji]);
                              }
                            }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform hover:scale-120 cursor-pointer ${
                              customReactions.includes(emoji)
                                ? 'bg-pastel-pink-400/25 border-2 border-pastel-pink-400 shadow-xs'
                                : 'bg-surface-hover/60 border border-border/40 hover:bg-surface'
                            }`}
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
                <button
                  type="button"
                  onClick={() => handleSaveCustomReactions(DEFAULT_REACTIONS)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Default
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiCustomizer(false)}
                  className="px-5 py-2 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-all cursor-pointer"
                >
                  Save & Done ✨
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
