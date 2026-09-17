import { useState, useRef, useEffect, useCallback } from 'react';
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
  Edit3
} from 'lucide-react';
import { useFirestore, fb, useChatMessages, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PREMADE_GIFS_AND_STICKERS } from '../data/stickers';
import { encryptMessage, decryptMessage } from '../crypto';

const springConfig: Transition = { type: 'spring', bounce: 0.6, duration: 0.8 };
const quickReactions = ['❤️', '🌸', '✨', '🥺', '🤍', '🌙', '💍'];

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

  // Live Settings
  const settingsArray = useFirestore<any>('userSettings', 'id', false) || [];
  const globalSettings = settingsArray.find(s => s.id === 'global') || {};
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  const startDateStr = globalSettings.relationshipStart || localStorage.getItem('tulip_relationship_start') || '2023-08-14';

  useEffect(() => {
    const updateLoveTimer = () => {
      const start = new Date(`${startDateStr}T00:00:00`).getTime();
      const now = Date.now();
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
  const [messages, setMessages] = useState<any[]>([]);
  const passcode = localStorage.getItem('tulip_custom_sanctuary_pass') || '2026';

  // Decrypt messages dynamically
  useEffect(() => {
    const decryptAll = async () => {
      const decrypted = await Promise.all(encryptedMessages.map(async (msg) => {
        let content = msg.content;
        let mediaUrl = msg.mediaUrl;
        if (content) {
          try { content = await decryptMessage(content, passcode); } catch(e){}
        }
        if (mediaUrl) {
          try { mediaUrl = await decryptMessage(mediaUrl, passcode); } catch(e){}
        }
        return { ...msg, content, mediaUrl };
      }));
      setMessages(decrypted);
    };
    decryptAll();
  }, [encryptedMessages, passcode]);

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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (editingMsgId) {
      if (!editContent.trim()) return;
      if ('vibrate' in navigator) navigator.vibrate(40);
      const encContent = await encryptMessage(editContent.trim(), passcode);
      await fb.messages.update(editingMsgId, { content: encContent, isEdited: true });
      setEditingMsgId(null);
      setEditContent('');
      return;
    }

    if (!inputText.trim()) return;
    
    // Easter Egg Check
    if (inputText.trim().toLowerCase() === 'aim') {
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      // Trigger a special visual effect in the chat
      setInputText('I love you immensely, always and forever. ✨');
      return;
    }

    if ('vibrate' in navigator) navigator.vibrate(40);
    const encContent = await encryptMessage(inputText.trim(), passcode);

    await fb.messages.add({
      id: crypto.randomUUID(),
      sender: currentUser,
      type: 'text',
      content: encContent,
      createdAt: Date.now()
    });

    setInputText('');
    fb.typing.set(currentUser, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleSendImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        if ('vibrate' in navigator) navigator.vibrate(50);
        const encContent = await encryptMessage('Sent a photo', passcode);
        const encUrl = await encryptMessage(ev.target.result as string, passcode);
        await fb.messages.add({
          id: crypto.randomUUID(),
          sender: currentUser,
          type: 'image',
          content: encContent,
          mediaUrl: encUrl,
          createdAt: Date.now()
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendGifOrSticker = async (url: string, type: 'gif' | 'sticker') => {
    if ('vibrate' in navigator) navigator.vibrate(40);
    const encContent = await encryptMessage(url, passcode);
    await fb.messages.add({
      id: crypto.randomUUID(),
      sender: currentUser,
      type,
      content: encContent,
      createdAt: Date.now()
    });
    setShowStickerPicker(false);
  };

  const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        await fb.stickers.add({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl: ev.target.result as string,
          createdAt: Date.now()
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Real Voice Notes (Using Base64 to bypass Firebase Storage Rule issues)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Let the browser pick its preferred codec, but attempt a low bitrate first to keep Base64 strings small
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, { audioBitsPerSecond: 16000 });
      } catch (e) {
        console.warn("Low bitrate not supported, falling back to default:", e);
        mediaRecorderRef.current = new MediaRecorder(stream);
      }
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start(250); // Use a 250ms timeslice to force chunks (fixes iOS bug)
      setIsRecording(true);
      if ('vibrate' in navigator) navigator.vibrate(50);
    } catch (err: any) {
      console.error("Mic error:", err);
      alert(`Could not start microphone: ${err.message || 'Check browser permissions'}`);
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Temporarily remove onstop so it doesn't trigger a send
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    audioChunksRef.current = [];
  };

  const handleSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = async () => {
       setIsRecording(false);
       
       const mimeType = mediaRecorderRef.current?.mimeType || 'audio/mp4';
       const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
       
       if (audioBlob.size === 0) {
         alert("Recording failed: 0 bytes captured. Please try again.");
         return;
       }
       
       const reader = new FileReader();
       reader.onloadend = async () => {
         const base64data = reader.result as string;
         try {
           const encUrl = await encryptMessage(base64data, passcode);
           const encContent = await encryptMessage('Voice note', passcode);
           
           await fb.messages.add({
             id: crypto.randomUUID(),
             sender: currentUser,
             type: 'audio',
             content: encContent,
             mediaUrl: encUrl,
             createdAt: Date.now()
           });
         } catch (err: any) {
           console.error("Audio encryption/upload failed:", err);
           if (err?.message?.toLowerCase().includes('size') || err?.message?.toLowerCase().includes('limit')) {
             alert("Voice note is too long! Please keep voice notes under 60 seconds to ensure they can be encrypted safely.");
           } else {
             alert("Failed to send voice note. Please try again.");
           }
         }
       };
       reader.readAsDataURL(audioBlob);
       
       if (streamRef.current) {
         streamRef.current.getTracks().forEach(track => track.stop());
       }
    };

    mediaRecorderRef.current.stop();
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    const msg = await fb.messages.get(msgId);
    if (!msg) return;

    const currentReactions = msg.reactions || [];
    const updated = currentReactions.includes(emoji)
      ? currentReactions.filter(r => r !== emoji)
      : [...currentReactions, emoji];

    await fb.messages.update(msgId, { reactions: updated });
    if ('vibrate' in navigator) navigator.vibrate(30);
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

        {/* Right: Search Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto">
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

      {/* MESSAGE STREAM */}
      <div className="flex-1 bg-gradient-to-b from-transparent to-pastel-pink-100/10 dark:to-pastel-pink-900/10 overflow-y-auto px-3 py-4 md:p-6 scroll-smooth flex flex-col gap-3 relative">
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
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={springConfig}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group mb-${isLastInCluster ? '2' : '0.5'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}>
                  
                  {/* Sender Tag (Only show for first in cluster) */}
                  {showName && (
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 px-1">
                      {msg.sender}
                    </span>
                  )}

                  {/* Bubble Container */}
                  <div className="relative group/bubble flex flex-col">
                    {msg.type === 'text' && (
                      <div
                        onClick={() => setSelectedMsgId(isSelected ? null : msg.id)}
                        className={`px-5 py-3.5 shadow-sm font-medium text-[15px] leading-relaxed transition-all cursor-pointer ${corners} ${
                          isMe
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                            : 'bg-white/10 backdrop-blur-md border border-white/10 text-white'
                        }`}
                      >
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
                        onClick={() => setSelectedMsgId(isSelected ? null : msg.id)}
                        className={`px-3 py-2 flex items-center shadow-sm cursor-pointer ${corners} ${
                          isMe
                            ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                            : 'bg-white/10 backdrop-blur-md border border-white/10 text-white'
                        }`}
                      >
                        <audio controls src={msg.mediaUrl} className="h-10 w-48 outline-none grayscale" />
                      </div>
                    )}

                    {/* TAP ACTION MENU (For Mobile / Easy Access) */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, scale: 0.9 }}
                          animate={{ opacity: 1, height: 'auto', scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.9 }}
                          className={`flex flex-col gap-2 mt-2 p-2 bg-surface/90 backdrop-blur-md rounded-2xl border border-border shadow-md z-30 ${isMe ? 'origin-top-right' : 'origin-top-left'}`}
                        >
                          <div className="flex gap-1 justify-around">
                            {quickReactions.slice(0, 4).map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => { handleReaction(msg.id, emoji); setSelectedMsgId(null); }}
                                className="text-xl hover:scale-125 transition-transform cursor-pointer p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          {isMe && msg.type === 'text' && (
                            <div className="flex border-t border-border pt-1 gap-2">
                              <button
                                type="button"
                                onClick={() => { 
                                  setEditingMsgId(msg.id); 
                                  setEditContent(msg.content); 
                                  setSelectedMsgId(null); 
                                }}
                                className="flex-1 py-1 text-xs font-bold text-text-muted hover:text-pastel-pink-400 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => { handleDeleteMessage(msg.id); setSelectedMsgId(null); }}
                                className="flex-1 py-1 text-xs font-bold text-text-muted hover:text-red-400 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                          {(!isMe || msg.type !== 'text') && (
                            <div className="flex border-t border-border pt-1 justify-center">
                               <button
                                type="button"
                                onClick={() => { handleDeleteMessage(msg.id); setSelectedMsgId(null); }}
                                className="flex-1 py-1 text-xs font-bold text-text-muted hover:text-red-400 cursor-pointer"
                              >
                                Delete for everyone
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Quick Reactions on Hover (Desktop) */}
                    <div className={`hidden md:flex absolute -top-7 ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover/bubble:opacity-100 transition-opacity gap-1 bg-surface/95 backdrop-blur-xl border border-border px-2 py-1 rounded-full shadow-lg z-30`}>
                      {quickReactions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleReaction(msg.id, emoji)}
                          className="text-xs hover:scale-130 transition-transform cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                      {isMe && msg.type === 'text' && (
                        <button
                          type="button"
                          onClick={() => { setEditingMsgId(msg.id); setEditContent(msg.content); }}
                          className="text-text-muted hover:text-pastel-pink-400 ml-1 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-text-muted hover:text-red-400 ml-1 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Reaction Badges */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1 px-1">
                      {msg.reactions.map((r: string, i: number) => (
                        <span
                          key={i}
                          onClick={() => handleReaction(msg.id, r)}
                          className="text-xs bg-surface-hover border border-border px-2 py-0.5 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Edited Tag */}
                  <div className="flex items-center gap-1 mt-1 px-2">
                    <span className="text-[10px] text-text-muted font-medium">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.isEdited && (
                      <span className="text-[9px] text-text-muted/60 font-medium italic">
                        (edited)
                      </span>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {isOtherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="flex w-full justify-start mt-2"
            >
              <div className="bg-surface border border-border px-4 py-2.5 rounded-[1.8rem] rounded-bl-xs flex items-center gap-1.5 shadow-sm w-fit">
                <span className="w-1.5 h-1.5 bg-pastel-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-pastel-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-pastel-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
        <div className="p-1 md:p-1.5 border border-pastel-pink-300/40 bg-surface/95 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center relative z-20 overflow-hidden">
          
          {editingMsgId ? (
            <div className="w-full flex items-center gap-2 px-3 py-1.5 h-[42px] md:h-[46px]">
              <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider shrink-0 hidden sm:block">Editing</div>
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
                Recording Voice Note...
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
              
              {/* Sticker / GIF Picker Toggle */}
              <button
                type="button"
                onClick={() => setShowStickerPicker(!showStickerPicker)}
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
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={`Message ${currentUser === 'Mahad' ? 'Ifa' : 'Mahad'}...`}
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
              className="absolute bottom-[85px] left-4 right-4 bg-surface/98 backdrop-blur-lg border border-border rounded-[2.5rem] p-6 shadow-2xl z-30"
            >
              {/* Header with Tabs */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
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
                    <Film className="w-3.5 h-3.5" /> Cute GIFs
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
                accept="image/png,image/webp"
                onChange={handleCustomStickerUpload}
              />

              {/* TAB 1: PREMADE CUTE GIFS */}
              {stickerTab === 'gifs' && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {PREMADE_GIFS_AND_STICKERS.map((item) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSendGifOrSticker(item.url, 'gif')}
                      className="aspect-square rounded-2xl overflow-hidden border border-border bg-surface-hover hover:border-pastel-pink-400 transition-all cursor-pointer p-1"
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                    </motion.button>
                  ))}
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

    </div>
  );
}
