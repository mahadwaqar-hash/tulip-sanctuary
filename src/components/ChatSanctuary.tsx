import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Send, 
  SmilePlus, 
  Image as ImageIcon, 
  X, 
  Mic, 
  Search, 
  Heart, 
  Sparkles, 
  Trash2, 
  Play, 
  Volume2,
  Film,
  Edit3
} from 'lucide-react';
import { useFirestore, fb } from '../firebase';
import { PREMADE_GIFS_AND_STICKERS } from '../data/stickers';

const springConfig: Transition = { type: 'spring', stiffness: 350, damping: 25 };
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

  // How long we've been in love state & live ticker
  const [startDateStr, setStartDateStr] = useState(() => {
    return localStorage.getItem('tulip_relationship_start') || '2023-08-14';
  });
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const updateLoveTimer = () => {
      const start = new Date(startDateStr + 'T00:00:00').getTime();
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

  const handleSaveStartDate = (newDate: string) => {
    setStartDateStr(newDate);
    localStorage.setItem('tulip_relationship_start', newDate);
    setIsEditingStart(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageMsgRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live Messages & Custom Stickers
  const messages = useFirestore<any>('messages', 'createdAt', false);
  const customStickers = useFirestore<any>('stickers', 'createdAt', true);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if ('vibrate' in navigator) navigator.vibrate(40);

    await fb.messages.add({
      id: crypto.randomUUID(),
      sender: currentUser,
      type: 'text',
      content: inputText.trim(),
      createdAt: Date.now()
    });

    setInputText('');
  };

  const handleSendImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        if ('vibrate' in navigator) navigator.vibrate(50);
        await fb.messages.add({
          id: crypto.randomUUID(),
          sender: currentUser,
          type: 'image',
          content: 'Sent a photo',
          mediaUrl: ev.target.result as string,
          createdAt: Date.now()
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendGifOrSticker = async (url: string, type: 'gif' | 'sticker') => {
    if ('vibrate' in navigator) navigator.vibrate(40);
    await fb.messages.add({
      id: crypto.randomUUID(),
      sender: currentUser,
      type,
      content: url,
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
        await db.stickers.add({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl: ev.target.result as string,
          createdAt: Date.now()
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendAudioNote = async () => {
    setIsRecording(true);
    if ('vibrate' in navigator) navigator.vibrate(50);

    setTimeout(async () => {
      setIsRecording(false);
      await fb.messages.add({
        id: crypto.randomUUID(),
        sender: currentUser,
        type: 'audio',
        content: 'Voice note (0:14)',
        audioDuration: 14,
        createdAt: Date.now()
      });
      if ('vibrate' in navigator) navigator.vibrate([40, 60]);
    }, 2000);
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
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full rounded-[2.5rem] glass-panel shadow-2xl overflow-hidden border border-border relative">
      
      {/* CHAT HEADER */}
      <div className="px-5 py-3 border-b border-border bg-surface/85 backdrop-blur-md z-20 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        
        {/* Left: User & Avatar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pastel-pink-300 to-pastel-pink-400 text-white flex items-center justify-center shadow-md font-serif-italic font-bold text-lg">
              {currentUser === 'Mahad' ? 'M' : 'I'}
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-charcoal absolute -bottom-0.5 -right-0.5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-text-main flex items-center gap-1.5 leading-tight">
              <span>Chatting as <strong className="text-pastel-pink-400">{currentUser}</strong></span>
              <Heart className="w-3.5 h-3.5 text-pastel-pink-400 fill-pastel-pink-400 animate-pulse" />
            </h2>
            <span className="text-[10px] text-text-muted font-medium">
              Private 2-Player Haven • Online
            </span>
          </div>
        </div>

        {/* Center: HOW LONG WE'VE BEEN IN LOVE BANNER */}
        <div className="flex items-center justify-between md:justify-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-hover/80 border border-pastel-pink-200/50 dark:border-pastel-pink-400/20 shadow-xs">
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
              className="p-1.5 text-text-muted hover:text-pastel-pink-400 rounded-full hover:bg-surface transition-colors cursor-pointer ml-1"
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
              showSearch ? 'bg-pastel-pink-400 text-white' : 'text-text-muted hover:bg-surface-hover hover:text-text-main'
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
            className="px-6 py-3 border-b border-border bg-surface-hover/60 backdrop-blur-md overflow-hidden"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search words, memories, jokes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-full py-2 pl-10 pr-10 text-xs font-medium text-text-main outline-none focus:border-pastel-pink-400"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 text-text-muted hover:text-text-main text-xs">
                  ✕
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MESSAGE STREAM */}
      <div className="flex-1 bg-surface-hover/20 overflow-y-auto p-6 scroll-smooth flex flex-col gap-4">
        {filteredMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <motion.div 
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-pastel-pink-200 to-pastel-pink-400 text-white flex items-center justify-center mb-4 shadow-lg glow-rose-sm"
            >
              <Heart className="w-10 h-10 fill-white" />
            </motion.div>
            <span className="font-fairytale text-3xl sm:text-4xl text-pastel-pink-400 lowercase mb-1">
              our secret conversation
            </span>
            <h3 className="font-serif-italic text-2xl sm:text-3xl font-bold text-text-main">
              {currentUser === 'Mahad' ? 'Mahad loves Ifa' : 'Ifa loves Mahad'}
            </h3>
            <p className="text-xs text-text-muted mt-2 font-medium max-w-xs">
              Every thought, silly joke, late night secret, and cute GIF lives right here safely between us.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.sender === currentUser;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={springConfig}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`max-w-[80%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}>
                  
                  {/* Sender Tag */}
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1 px-1">
                    {msg.sender}
                  </span>

                  {/* Bubble Container */}
                  <div className="relative group/bubble">
                    {msg.type === 'text' && (
                      <div
                        className={`px-5 py-3.5 rounded-[1.8rem] shadow-sm font-medium text-[15px] leading-relaxed transition-all ${
                          isMe
                            ? 'bg-gradient-to-br from-pastel-pink-400 to-pastel-pink-300 text-white rounded-br-xs shadow-pastel-pink-200/50'
                            : 'bg-surface border border-border text-text-main rounded-bl-xs backdrop-blur-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {(msg.type === 'image' || msg.type === 'gif') && (
                      <div 
                        onClick={() => setPreviewImage(msg.mediaUrl || msg.content)}
                        className="rounded-[1.8rem] overflow-hidden border border-border/60 shadow-md cursor-pointer hover:opacity-95 transition-opacity max-w-xs sm:max-w-sm"
                      >
                        <img src={msg.mediaUrl || msg.content} alt="media" className="w-full max-h-72 object-cover" />
                      </div>
                    )}

                    {msg.type === 'sticker' && (
                      <div className="p-1">
                        <img
                          src={msg.content}
                          alt="sticker"
                          className="w-36 h-36 object-contain drop-shadow-xl hover:scale-105 transition-transform"
                        />
                      </div>
                    )}

                    {msg.type === 'audio' && (
                      <div
                        className={`px-5 py-3 rounded-[1.8rem] flex items-center gap-3 shadow-sm ${
                          isMe
                            ? 'bg-pastel-pink-400 text-white rounded-br-xs'
                            : 'bg-surface border border-border text-text-main rounded-bl-xs'
                        }`}
                      >
                        <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center cursor-pointer">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-3 bg-current rounded-full animate-pulse" />
                            <span className="w-1 h-5 bg-current rounded-full" />
                            <span className="w-1 h-2 bg-current rounded-full" />
                            <span className="w-1 h-6 bg-current rounded-full animate-pulse" />
                            <span className="w-1 h-4 bg-current rounded-full" />
                            <span className="w-1 h-2 bg-current rounded-full" />
                          </div>
                          <span className="text-[10px] opacity-80 mt-1">Voice note • 0:14</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Reactions on Hover */}
                    <div className={`absolute -top-7 ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover/bubble:opacity-100 transition-opacity flex gap-1 bg-surface/95 backdrop-blur-xl border border-border px-2 py-1 rounded-full shadow-lg z-30`}>
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
                      {msg.reactions.map((r, i) => (
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

                  {/* Timestamp */}
                  <span className="text-[10px] text-text-muted mt-1 px-2 font-medium">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                </div>
              </motion.div>
            );
          })
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
      <div className="p-4 border-t border-border bg-surface/90 backdrop-blur-md relative z-20">
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
          
          {/* Sticker / GIF Picker Toggle */}
          <button
            type="button"
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              showStickerPicker ? 'bg-pastel-pink-400 text-white shadow-md' : 'text-text-muted hover:bg-surface-hover hover:text-text-main'
            }`}
            title="GIFs & Stickers"
          >
            <SmilePlus className="w-5 h-5" />
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
            className="p-3 rounded-full text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors cursor-pointer"
            title="Send Photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Main Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Say something sweet to ${currentUser === 'Mahad' ? 'Ifa' : 'Mahad'}...`}
            className="flex-1 bg-surface-hover border border-border rounded-full py-3.5 px-6 outline-none focus:border-pastel-pink-400 focus:ring-4 focus:ring-pastel-pink-100/20 transition-all text-[15px] font-medium text-text-main placeholder:text-text-muted"
          />

          {/* Voice Note Button */}
          <button
            type="button"
            onClick={handleSendAudioNote}
            className={`p-3 rounded-full transition-colors cursor-pointer ${
              isRecording ? 'bg-red-400 text-white' : 'text-text-muted hover:bg-surface-hover hover:text-text-main'
            }`}
            title="Voice Note"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="p-3.5 rounded-full bg-pastel-pink-400 text-white shadow-md hover:bg-pastel-pink-300 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>

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
