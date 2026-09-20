import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
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
  MoreHorizontal,
  MapPin
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

const calculateTimeTogether = (startDate?: string) => {
  try {
    const safeStr = (startDate || '2023-08-14').trim();
    const dateToParse = safeStr.includes('T') ? safeStr : `${safeStr}T00:00:00`;
    const parsed = new Date(dateToParse).getTime();
    const start = isNaN(parsed) ? new Date('2023-08-14T00:00:00').getTime() : parsed;
    const now = typeof getNetworkNow === 'function' ? getNetworkNow() : Date.now();
    const diff = Math.max(0, now - start);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24)) || 0;
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24) || 0;
    const mins = Math.floor((diff / (1000 * 60)) % 60) || 0;
    const secs = Math.floor((diff / 1000) % 60) || 0;

    return { days, hours, mins, secs };
  } catch (e) {
    return { days: 0, hours: 0, mins: 0, secs: 0 };
  }
};

const formatLastSeen = (timestamp?: number) => {
  if (!timestamp) return 'recently';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
};

const LoveTimerDesktop = memo(function LoveTimerDesktop({
  startDateStr,
  onSaveStartDate
}: {
  startDateStr: string;
  onSaveStartDate: (d: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [timeTogether, setTimeTogether] = useState(() => calculateTimeTogether(startDateStr));

  useEffect(() => {
    const update = () => setTimeTogether(calculateTimeTogether(startDateStr));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDateStr]);

  return (
    <div className="flex items-center gap-1.5">
      <div 
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pastel-pink-500/10 border border-pastel-pink-500/20 hover:bg-pastel-pink-500/20 transition-all cursor-pointer group shrink-0"
        title="Click to edit our start date"
      >
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

      {isEditing ? (
        <div className="flex items-center gap-1 ml-2">
          <input
            type="date"
            defaultValue={startDateStr}
            onChange={(e) => {
              if (e.target.value) {
                onSaveStartDate(e.target.value);
                setIsEditing(false);
              }
            }}
            className="text-[10px] bg-surface p-1 rounded-md border border-pastel-pink-300 text-text-main outline-none"
          />
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1 rounded text-text-muted hover:text-text-main text-[10px]"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-text-muted hover:text-pastel-pink-400 rounded-full hover:bg-pastel-pink-100/10 transition-colors cursor-pointer ml-1"
          title="Change Anniversary / In Love Date"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});

const LoveTimerMobileTicker = memo(function LoveTimerMobileTicker({
  startDateStr,
  onSaveStartDate
}: {
  startDateStr: string;
  onSaveStartDate: (d: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [timeTogether, setTimeTogether] = useState(() => calculateTimeTogether(startDateStr));

  useEffect(() => {
    const update = () => setTimeTogether(calculateTimeTogether(startDateStr));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDateStr]);

  return (
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
      {isEditing ? (
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="date"
            defaultValue={startDateStr}
            onChange={(e) => {
              if (e.target.value) {
                onSaveStartDate(e.target.value);
                setIsEditing(false);
              }
            }}
            className="text-[10px] bg-surface p-1 rounded-md border border-pastel-pink-300 text-text-main outline-none"
          />
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1 rounded text-text-muted hover:text-text-main text-[10px]"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-1 text-text-muted hover:text-pastel-pink-400 text-[11px] font-medium flex items-center gap-1 shrink-0"
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit</span>
        </button>
      )}
    </div>
  );
});

interface ChatMessageItemProps {
  msg: any;
  currentUser: string;
  isFirstInCluster: boolean;
  isLastInCluster: boolean;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isPinned: boolean;
  userTz: string;
  customReactions: string[];
  audioSpeed: number;
  isLoveBurst: boolean;
  isCopied: boolean;
  onStartReply: (msg: any) => void;
  onSelectMsg: (msgId: string | null) => void;
  onHoverMsg: (msgId: string | null) => void;
  onQuickLove: (msgId: string) => void;
  onReaction: (msgId: string, emoji: string) => void;
  onCopyText: (text: string, msgId: string) => void;
  onTogglePin: (msgId: string) => void;
  onStartEdit: (msgId: string, content: string) => void;
  onDeleteMessage: (msgId: string) => void;
  onToggleAudioSpeed: (msgId: string) => void;
  onPreviewImage: (url: string | null) => void;
  onScrollToMessage: (msgId: string) => void;
  onOpenEmojiCustomizer: () => void;
}

const ChatMessageItem = memo(function ChatMessageItem({
  msg,
  currentUser,
  isFirstInCluster,
  isLastInCluster,
  isSelected,
  isHovered,
  isHighlighted,
  isPinned,
  userTz,
  customReactions,
  audioSpeed,
  isLoveBurst,
  isCopied,
  onStartReply,
  onSelectMsg,
  onHoverMsg,
  onQuickLove,
  onReaction,
  onCopyText,
  onTogglePin,
  onStartEdit,
  onDeleteMessage,
  onToggleAudioSpeed,
  onPreviewImage,
  onScrollToMessage,
  onOpenEmojiCustomizer,
}: ChatMessageItemProps) {
  const isMe = msg.sender === currentUser;
  const showName = isFirstInCluster;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  let corners = 'rounded-[1.5rem]';
  if (isMe) {
    corners = `rounded-[1.5rem] ${!isFirstInCluster ? 'rounded-tr-[4px]' : ''} ${!isLastInCluster ? 'rounded-br-[4px]' : 'rounded-br-[2px]'}`;
  } else {
    corners = `rounded-[1.5rem] ${!isFirstInCluster ? 'rounded-tl-[4px]' : ''} ${!isLastInCluster ? 'rounded-bl-[4px]' : 'rounded-bl-[2px]'}`;
  }

  // Group reactions, calculate separate counts, and determine if currentUser reacted
  const groupedReactions = useMemo(() => {
    if (msg.reactionsMap && typeof msg.reactionsMap === 'object') {
      const map: Record<string, { emoji: string; count: number; users: string[]; hasReacted: boolean }> = {};
      Object.entries(msg.reactionsMap as Record<string, string[]>).forEach(([user, emojis]) => {
        if (Array.isArray(emojis)) {
          emojis.forEach((emoji) => {
            if (!emoji) return;
            if (!map[emoji]) {
              map[emoji] = { emoji, count: 0, users: [], hasReacted: false };
            }
            map[emoji].count += 1;
            map[emoji].users.push(user);
            if (user === currentUser) {
              map[emoji].hasReacted = true;
            }
          });
        }
      });
      return Object.values(map);
    }

    if (msg.reactions && Array.isArray(msg.reactions) && msg.reactions.length > 0) {
      const map: Record<string, { emoji: string; count: number; users: string[]; hasReacted: boolean }> = {};
      msg.reactions.forEach((emoji: string) => {
        if (!emoji) return;
        if (!map[emoji]) {
          map[emoji] = { emoji, count: 0, users: [], hasReacted: false };
        }
        map[emoji].count += 1;
      });
      return Object.values(map);
    }

    return [];
  }, [msg.reactionsMap, msg.reactions, currentUser]);

  return (
    <motion.div
      id={`msg-${msg.id}`}
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={springConfig}
      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group mb-${isLastInCluster ? '2' : '0.5'} transition-all duration-500 rounded-3xl ${
        isHighlighted ? 'ring-2 ring-pastel-pink-400 bg-pastel-pink-400/20 p-1.5' : ''
      }`}
    >
      <div 
        onMouseEnter={() => onHoverMsg(msg.id)}
        onMouseLeave={() => onHoverMsg(null)}
        className={`max-w-[88%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}
      >
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
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDragEnd={(_e, info) => {
            if (Math.abs(info.offset.x) > 28) {
              onStartReply(msg);
              if ('vibrate' in navigator) navigator.vibrate([25, 25]);
            }
          }}
          onTouchStart={(e) => {
            touchStartRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          }}
          onTouchEnd={(e) => {
            if (!touchStartRef.current) return;
            const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
            const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
            touchStartRef.current = null;
            if (Math.abs(deltaX) > 28 && Math.abs(deltaY) < 65) {
              onStartReply(msg);
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
                onScrollToMessage(msg.replyTo.id);
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
                onSelectMsg(isSelected ? null : msg.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onQuickLove(msg.id);
              }}
              className={`px-5 py-3.5 shadow-md font-medium text-[15px] leading-relaxed transition-all cursor-pointer relative select-text ${corners} ${
                isMe
                  ? 'bubble-me-gradient chat-text-crisp font-semibold shadow-pastel-pink-400/20'
                  : 'bubble-other-themed font-medium'
              }`}
            >
              {isLoveBurst && (
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
              onClick={() => onPreviewImage(msg.mediaUrl || msg.content)}
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
                onSelectMsg(isSelected ? null : msg.id);
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
                  onToggleAudioSpeed(msg.id);
                }}
                className="px-2 py-1 rounded-lg bg-black/25 hover:bg-black/35 text-white text-[10px] font-extrabold uppercase tracking-wider transition-colors shrink-0"
                title="Playback Speed"
              >
                {audioSpeed}x
              </button>
            </div>
          )}
        </motion.div>

        {/* Reaction Badges on Message - Grouped with separate counts & accounts */}
        {groupedReactions.length > 0 && (
          <div className="flex gap-1.5 mt-1 px-1 flex-wrap items-center">
            {groupedReactions.map(({ emoji, count, users, hasReacted }) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(msg.id, emoji);
                }}
                title={users.length > 0 ? `${users.join(', ')} reacted with ${emoji}` : `${count} reaction${count > 1 ? 's' : ''}`}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shadow-2xs cursor-pointer hover:scale-110 active:scale-95 transition-all select-none ${
                  hasReacted 
                    ? 'bg-pastel-pink-500/20 border border-pastel-pink-500/40 text-text-main font-semibold ring-1 ring-pastel-pink-500/30' 
                    : 'bg-surface-hover/90 border border-border text-text-main hover:bg-surface-hover'
                }`}
              >
                <span className="text-xs">{emoji}</span>
                {count > 1 && (
                  <span className={`text-[10px] font-bold ${hasReacted ? 'text-pastel-pink-600 dark:text-pastel-pink-300' : 'text-text-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Clean, Non-Cramped Status Row: Timestamp & Seen Indicator Always Sleek & Minimal */}
        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-text-muted select-none">
          <span>{formatMessageTime(msg.createdAt, userTz)}</span>
          {msg.isEdited && (
            <span className="text-[9px] text-pastel-pink-400 font-medium italic">
              (edited)
            </span>
          )}
          {isMe && (
            <span
              className="flex items-center gap-0.5"
              title={msg.isRead ? (msg.readAt ? `Read at ${formatMessageTime(msg.readAt, userTz)}` : 'Seen') : 'Sent'}
            >
              {msg.isRead ? (
                <>
                  <CheckCheck className="w-3 h-3 text-pastel-pink-400 stroke-[2.5]" />
                  <span className="text-[9px] text-pastel-pink-400 font-bold tracking-tight">
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
        </div>

        {/* Intelligent Frosted Action Popover: Floats directly ABOVE the chat bubble */}
        <AnimatePresence>
          {(isSelected || isHovered) && (
            <motion.div
              data-action-row="true"
              initial={{ opacity: 0, scale: 0.88, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute z-30 ${
                isMe ? 'right-0' : 'left-0'
              } bottom-full mb-2 flex items-center gap-1 sm:gap-1.5 bg-surface/98 backdrop-blur-2xl border border-pastel-pink-300/40 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-2xl max-w-[calc(100vw-28px)] overflow-x-auto select-none`}
              style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))' }}
            >
              {/* Emojis */}
              {(Array.isArray(customReactions) ? customReactions : DEFAULT_REACTIONS).slice(0, 6).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReaction(msg.id, emoji);
                    onSelectMsg(null);
                    onHoverMsg(null);
                  }}
                  className="text-sm sm:text-lg hover:scale-125 active:scale-90 transition-transform cursor-pointer px-0.5 sm:px-1 py-0.5 leading-none"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEmojiCustomizer();
                  onSelectMsg(null);
                  onHoverMsg(null);
                }}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center bg-pastel-pink-400/15 hover:bg-pastel-pink-400 text-pastel-pink-400 hover:text-white transition-all text-[10px] sm:text-xs font-bold shrink-0 cursor-pointer mr-0.5 sm:mr-1"
                title="Customize reaction emojis"
              >
                +
              </button>

              <div className="w-[1px] h-3 sm:h-3.5 bg-border/80 shrink-0 mx-0.5" />

              {/* Reply Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartReply(msg);
                  onSelectMsg(null);
                  onHoverMsg(null);
                }}
                className="p-1 text-text-muted hover:text-pastel-pink-400 hover:bg-pastel-pink-400/10 rounded-full transition-all shrink-0 cursor-pointer"
                title="Reply"
              >
                <Reply className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              {/* Copy Text Button */}
              {msg.type === 'text' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyText(msg.content, msg.id);
                    onSelectMsg(null);
                    onHoverMsg(null);
                  }}
                  className="p-1 text-text-muted hover:text-pastel-pink-400 hover:bg-pastel-pink-400/10 rounded-full transition-all shrink-0 cursor-pointer"
                  title="Copy text"
                >
                  {isCopied ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                </button>
              )}

              {/* Pin / Unpin Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(msg.id);
                  onSelectMsg(null);
                  onHoverMsg(null);
                }}
                className={`p-1 rounded-full transition-all shrink-0 cursor-pointer ${
                  isPinned
                    ? 'text-pastel-pink-400 bg-pastel-pink-400/15'
                    : 'text-text-muted hover:text-pastel-pink-400 hover:bg-pastel-pink-400/10'
                }`}
                title={isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              {/* Edit Button */}
              {isMe && msg.type === 'text' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit(msg.id, msg.content);
                    onSelectMsg(null);
                    onHoverMsg(null);
                  }}
                  className="p-1 text-text-muted hover:text-pastel-pink-400 hover:bg-pastel-pink-400/10 rounded-full transition-all shrink-0 cursor-pointer"
                  title="Edit message"
                >
                  <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}

              {/* Delete Button */}
              {isMe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMessage(msg.id);
                    onSelectMsg(null);
                    onHoverMsg(null);
                  }}
                  className="p-1 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all shrink-0 cursor-pointer"
                  title="Delete message"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

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

  // Presence & Exact Location Tracking
  const presenceData = useFirestore<any>('presence', 'none');
  const partnerName = currentUser === 'Mahad' ? 'Ifa' : 'Mahad';
  const partnerPresence = useMemo(() => {
    return presenceData.find((p: any) => p.id === partnerName);
  }, [presenceData, partnerName]);
  const myPresence = useMemo(() => {
    return presenceData.find((p: any) => p.id === currentUser);
  }, [presenceData, currentUser]);

  const isPartnerOnline = useMemo(() => {
    if (!partnerPresence || partnerPresence.online === false) return false;
    const lastSeen = partnerPresence.lastSeen || 0;
    return (Date.now() - lastSeen) < 90 * 1000;
  }, [partnerPresence]);

  useEffect(() => {
    let isCancelled = false;
    let locationData: any = null;

    const pushPresence = (isOnline: boolean, extraLoc?: any) => {
      const payload = {
        online: isOnline,
        lastSeen: Date.now(),
        ...(locationData || {}),
        ...(extraLoc || {})
      };
      fb.presence.set(currentUser, payload);
    };

    const fetchLocationAndInit = async () => {
      try {
        const cached = sessionStorage.getItem('tulip_user_location');
        if (cached) {
          locationData = JSON.parse(cached);
        }
      } catch (e) {}

      if (!locationData) {
        try {
          const res = await fetch('https://ipwho.is/');
          if (res.ok) {
            const data = await res.json();
            if (data && data.success !== false) {
              const parts = [data.city, data.region, data.country_code || data.country].filter(Boolean);
              locationData = {
                city: data.city || '',
                region: data.region || '',
                country: data.country || '',
                countryCode: data.country_code || '',
                latitude: data.latitude || 0,
                longitude: data.longitude || 0,
                locationName: parts.join(', ') || 'Unknown Location'
              };
              sessionStorage.setItem('tulip_user_location', JSON.stringify(locationData));
            }
          }
        } catch (err) {
          console.warn('IP geolocation lookup failed:', err);
        }
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (isCancelled) return;
            locationData = {
              ...(locationData || {}),
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            };
            pushPresence(true);
          },
          () => {},
          { timeout: 6000, maximumAge: 300000 }
        );
      }

      if (!isCancelled) {
        pushPresence(true);
      }
    };

    fetchLocationAndInit();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pushPresence(true);
      }
    }, 35000);

    const handleVisibility = () => {
      pushPresence(document.visibilityState === 'visible');
    };

    const handleUnload = () => {
      pushPresence(false);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleUnload);
      pushPresence(false);
    };
  }, [currentUser]);

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
      const cleanQ = query.trim().toLowerCase();
      
      // 1. Search local curated animated database
      const filteredPremade = PREMADE_GIFS_AND_STICKERS.filter(g => {
        if (!cleanQ) return true;
        return g.name.toLowerCase().includes(cleanQ) || 
               g.category.toLowerCase().includes(cleanQ) ||
               cleanQ.split(' ').some(word => g.name.toLowerCase().includes(word));
      }).map(g => g.url);

      // 2. Fetch from live anime reactions (nekos.best / otakugifs)
      let liveUrls: string[] = [];
      try {
        const catMap: Record<string, string> = {
          'hug': 'hug',
          'kiss': 'kiss',
          'pat': 'pat',
          'cuddle': 'cuddle',
          'love': 'hug',
          'dance': 'dance',
          'smile': 'smile',
          'happy': 'happy',
          'laugh': 'laugh',
          'blush': 'blush',
          'cat': 'pat',
          'funny': 'laugh',
          'cry': 'cry',
          'sleep': 'sleep',
          'wave': 'wave'
        };

        const targetAction = Object.keys(catMap).find(k => cleanQ.includes(k)) || (cleanQ ? null : 'hug');
        if (targetAction) {
          const endpoint = `https://nekos.best/api/v2/${catMap[targetAction]}?amount=12`;
          const res = await fetch(endpoint);
          const data = await res.json();
          if (data && Array.isArray(data.results)) {
            liveUrls = data.results.map((r: any) => r.url).filter(Boolean);
          }
        }
      } catch (liveErr) {
        // Fallback to local curated
      }

      // Combine unique GIFs
      const combined = Array.from(new Set([...filteredPremade, ...liveUrls]));
      setTenorGifs(prev => (append ? Array.from(new Set([...prev, ...combined])) : combined));
      setGifOffset(offset + 20);
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

  const handleReaction = useCallback(async (msgId: string, emoji: string) => {
    try {
      const targetMsg = messages.find(m => m.id === msgId);
      let reactionsMap: Record<string, string[]> = targetMsg?.reactionsMap ? { ...targetMsg.reactionsMap } : {};

      if (!reactionsMap || Object.keys(reactionsMap).length === 0) {
        if (!targetMsg) {
          const fetched = await fb.messages.get(msgId);
          reactionsMap = fetched?.reactionsMap ? { ...fetched.reactionsMap } : {};
          if ((!reactionsMap || Object.keys(reactionsMap).length === 0) && fetched?.reactions) {
            reactionsMap = { [currentUser]: [...fetched.reactions] };
          }
        } else if (targetMsg.reactions && targetMsg.reactions.length > 0) {
          reactionsMap = { [currentUser]: [...targetMsg.reactions] };
        }
      }

      const currentUserReactions: string[] = Array.isArray(reactionsMap[currentUser]) 
        ? [...reactionsMap[currentUser]] 
        : [];

      // Toggle emoji for currentUser
      const updatedUserReactions = currentUserReactions.includes(emoji)
        ? currentUserReactions.filter(r => r !== emoji)
        : [...currentUserReactions, emoji];

      const nextReactionsMap: Record<string, string[]> = {
        ...reactionsMap,
        [currentUser]: updatedUserReactions
      };

      // Flatten for backward compatibility
      const allReactions: string[] = [];
      Object.values(nextReactionsMap).forEach((list) => {
        if (Array.isArray(list)) {
          allReactions.push(...list);
        }
      });

      await fb.messages.update(msgId, { 
        reactionsMap: nextReactionsMap,
        reactions: allReactions 
      });

      if ('vibrate' in navigator) navigator.vibrate(30);
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  }, [messages, currentUser]);

  const handleQuickLove = useCallback((msgId: string) => {
    setLoveBurstMsgId(msgId);
    if ('vibrate' in navigator) navigator.vibrate([30, 30]);
    handleReaction(msgId, '❤️');
    setTimeout(() => setLoveBurstMsgId(null), 1000);
  }, [handleReaction]);

  const handleCopyText = useCallback((text: string, msgId: string) => {
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
  }, []);

  const toggleAudioSpeed = useCallback((msgId: string) => {
    setAudioSpeeds(prev => {
      const current = prev[msgId] || 1;
      const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
      const audioEl = document.querySelector(`[data-audio-id="${msgId}"]`) as HTMLAudioElement;
      if (audioEl) audioEl.playbackRate = next;
      return { ...prev, [msgId]: next };
    });
  }, []);

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

  const handleStartReply = useCallback((msg: any) => {
    setReplyingTo({
      id: msg.id,
      sender: msg.sender,
      content: msg.content || '',
      type: msg.type || 'text',
      mediaUrl: msg.mediaUrl || null
    });
    setSelectedMsgId(null);
    setTimeout(() => chatInputRef.current?.focus(), 80);
  }, []);

  const scrollToMessage = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(id);
      setTimeout(() => setHighlightedMsgId(null), 2000);
    }
  }, []);

  // Aggressive Client-Side WebP Compression (Max 1024px, 0.6 Quality ~100KB)
  const compressToWebpBlob = (file: File, maxDim = 1024, quality = 0.6): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context failed'));

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('WebP blob creation failed'));
            },
            'image/webp',
            quality
          );
        };
        img.onerror = reject;
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadCompressedPhoto = async (file: File): Promise<string> => {
    const webpBlob = await compressToWebpBlob(file, 1024, 0.6);
    const filename = `photos/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
    const storageRef = ref(storage, filename);
    
    // Upload bytes with WebP content type
    await uploadBytes(storageRef, webpBlob, { contentType: 'image/webp' });
    return await getDownloadURL(storageRef);
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

  const startDateStr = globalSettings.relationshipStart || localStorage.getItem('tulip_relationship_start') || '2023-08-14';

  const handleSaveStartDate = useCallback(async (newDate: string) => {
    localStorage.setItem('tulip_relationship_start', newDate);
    await fb.userSettings.set('global', { relationshipStart: newDate });
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageMsgRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Keep focus locked onto the input field immediately so virtual keyboard never closes
    chatInputRef.current?.focus();

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

      // Re-focus input immediately after state clearing
      chatInputRef.current?.focus();

      const replyData = replyingTo ? {
        id: replyingTo.id,
        sender: replyingTo.sender,
        content: replyingTo.content || '',
        type: replyingTo.type || 'text',
        mediaUrl: replyingTo.mediaUrl || null
      } : null;
      if (replyingTo) setReplyingTo(null);

      // Retain focus through banner collapse
      chatInputRef.current?.focus();
      requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });

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

      // Re-affirm focus after async write completes
      requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err: any) {
      console.error('[AIM] SEND FAILED:', err);
      alert(`Message failed to send: ${err?.message || String(err)}`);
    }
  };

  const handleSendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
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

      // Perform aggressive client-side WebP compression (max 1024px, 0.6 quality ~100KB) and upload to Storage
      let downloadUrl = '';
      try {
        downloadUrl = await uploadCompressedPhoto(file);
      } catch (uploadErr) {
        console.warn('Storage upload error, falling back to local compressed base64:', uploadErr);
        // Fallback to compressed base64 if Firebase Storage rules block upload
        const blob = await compressToWebpBlob(file, 1024, 0.6);
        downloadUrl = await new Promise((res) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result as string);
          fr.readAsDataURL(blob);
        });
      }

      await fb.messages.add({
        id: msgId,
        sender: currentUser,
        type: 'image',
        content: 'Sent a photo',
        mediaUrl: downloadUrl,
        createdAt: newCreatedAt,
        ...(replyData ? { replyTo: replyData } : {})
      });
    } catch (err: any) {
      console.error('Failed to compress/upload image:', err);
      alert('Could not send photo: ' + (err?.message || String(err)));
    } finally {
      e.target.value = '';
    }
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

  const handleDeleteMessage = useCallback(async (msgId: string) => {
    if (confirm('Are you sure you want to erase this memory from our sanctuary?')) {
      if ('vibrate' in navigator) navigator.vibrate(40);
      try {
        await fb.messages.delete(msgId);
      } catch (err: any) {
        console.error('[AIM] DELETE FAILED:', err);
        alert(`Could not delete message: ${err?.message || String(err)}`);
      }
    }
  }, []);

  const handleTogglePin = useCallback((msgId: string) => {
    const isPinned = globalSettings.pinnedMessageId === msgId;
    fb.userSettings.set('global', { pinnedMessageId: isPinned ? null : msgId });
  }, [globalSettings.pinnedMessageId]);

  const handleStartEdit = useCallback((msgId: string, content: string) => {
    setEditingMsgId(msgId);
    setEditContent(content);
  }, []);

  const handleSelectMsg = useCallback((msgId: string | null) => {
    setSelectedMsgId(msgId);
  }, []);

  const handleHoverMsg = useCallback((msgId: string | null) => {
    setHoveredMsgId(msgId);
  }, []);

  const handlePreviewImage = useCallback((url: string | null) => {
    setPreviewImage(url);
  }, []);

  const handleOpenEmojiCustomizer = useCallback(() => {
    setShowEmojiCustomizer(true);
  }, []);

  // Filter messages by search query (memoized to eliminate typing lag)
  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(m => 
      (m.content && m.content.toLowerCase().includes(q)) ||
      (m.sender && m.sender.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full md:rounded-[2rem] md:glass-panel md:shadow-2xl overflow-hidden md:border-2 md:border-pastel-pink-300/30 relative bg-surface/30 md:bg-transparent">
      
      {/* CHAT HEADER */}
      <div className="px-4 md:px-5 py-2 md:py-3 border-b border-pastel-pink-300/20 bg-surface/95 backdrop-blur-xl z-20 flex flex-row items-center justify-between gap-2 shadow-sm">
        
        {/* Left: User & Partner Avatar & Status */}
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-pastel-pink-400 to-rose-400 text-white flex items-center justify-center shadow-md font-serif-italic font-bold text-base md:text-lg">
              {partnerName === 'Ifa' ? 'I' : 'M'}
            </div>
            {/* Live Online / Offline Dot Indicator */}
            <span
              className={`w-3 h-3 rounded-full border-2 border-surface absolute -bottom-0.5 -right-0.5 shadow-xs transition-colors duration-300 ${
                isPartnerOnline ? 'bg-emerald-500 ring-2 ring-emerald-400/30' : 'bg-neutral-400'
              }`}
              title={isPartnerOnline ? `${partnerName} is online` : `${partnerName} is offline`}
            />
          </div>

          <div className="flex flex-col overflow-hidden max-w-[175px] xs:max-w-[210px] sm:max-w-[260px] md:max-w-xs">
            <h2 className="text-xs md:text-sm font-bold text-text-main flex items-center gap-1.5 leading-tight truncate">
              <span>{partnerName}</span>
              <Heart className="w-3 h-3 text-pastel-pink-400 fill-pastel-pink-400 animate-pulse shrink-0" />
              <span 
                className="text-[9px] md:text-[10px] font-normal text-text-muted bg-surface-hover/80 px-1.5 py-0.2 rounded-full border border-border shrink-0 cursor-default"
                title={`You are currently chatting as ${currentUser}${myPresence?.locationName ? ` (${myPresence.locationName})` : ''}`}
              >
                You: {currentUser}
              </span>
            </h2>

            {/* Live Online & Exact Location indicator */}
            <div className="text-[10px] md:text-[11px] font-medium truncate flex items-center gap-1.5 text-text-muted">
              {isPartnerOnline ? (
                <>
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-emerald-500 font-bold tracking-tight">Online</span>
                  {partnerPresence?.locationName && (
                    <>
                      <span className="text-text-muted/50">•</span>
                      <span className="truncate flex items-center gap-0.5" title={`Online from ${partnerPresence.locationName}`}>
                        <MapPin className="w-3 h-3 text-pastel-pink-500 shrink-0" />
                        <span className="truncate">{partnerPresence.locationName}</span>
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                  <span className="shrink-0">
                    {partnerPresence?.lastSeen 
                      ? `Seen ${formatLastSeen(partnerPresence.lastSeen)}`
                      : 'Offline'}
                  </span>
                  {partnerPresence?.locationName && (
                    <>
                      <span className="text-text-muted/50">•</span>
                      <span className="truncate flex items-center gap-0.5" title={`Last seen in ${partnerPresence.locationName}`}>
                        <MapPin className="w-2.5 h-2.5 text-text-muted shrink-0" />
                        <span className="truncate">{partnerPresence.locationName}</span>
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: HOW LONG WE'VE BEEN IN LOVE BANNER (HIDDEN ON MOBILE) */}
        <div className="hidden lg:flex items-center justify-between md:justify-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-hover/80 border border-pastel-pink-300/30 shadow-xs">
          <LoveTimerDesktop startDateStr={startDateStr} onSaveStartDate={handleSaveStartDate} />
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
      <LoveTimerMobileTicker startDateStr={startDateStr} onSaveStartDate={handleSaveStartDate} />

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
            const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
            const nextMsg = index < filteredMessages.length - 1 ? filteredMessages[index + 1] : null;
            const isFirstInCluster = prevMsg?.sender !== msg.sender;
            const isLastInCluster = nextMsg?.sender !== msg.sender;

            return (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                currentUser={currentUser}
                isFirstInCluster={isFirstInCluster}
                isLastInCluster={isLastInCluster}
                isSelected={selectedMsgId === msg.id}
                isHovered={hoveredMsgId === msg.id}
                isHighlighted={highlightedMsgId === msg.id}
                isPinned={globalSettings.pinnedMessageId === msg.id}
                userTz={userTz}
                customReactions={customReactions}
                audioSpeed={audioSpeeds[msg.id] || 1}
                isLoveBurst={loveBurstMsgId === msg.id}
                isCopied={copiedMsgId === msg.id}
                onStartReply={handleStartReply}
                onSelectMsg={handleSelectMsg}
                onHoverMsg={handleHoverMsg}
                onQuickLove={handleQuickLove}
                onReaction={handleReaction}
                onCopyText={handleCopyText}
                onTogglePin={handleTogglePin}
                onStartEdit={handleStartEdit}
                onDeleteMessage={handleDeleteMessage}
                onToggleAudioSpeed={toggleAudioSpeed}
                onPreviewImage={handlePreviewImage}
                onScrollToMessage={scrollToMessage}
                onOpenEmojiCustomizer={handleOpenEmojiCustomizer}
              />
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
      <div className="p-2 md:p-4 shrink-0 bg-transparent md:bg-surface/90 md:backdrop-blur-xl md:border-t md:border-border z-20 w-full relative mb-1 md:mb-0">
        
        {/* Reply Preview Banner (Discord / WhatsApp Style) */}
        <AnimatePresence>
          {replyingTo && !editingMsgId && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="mb-2 px-4 py-2 rounded-2xl bg-surface/98 md:backdrop-blur-xl border border-pastel-pink-300/40 shadow-lg flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-1.5 rounded-xl bg-pastel-pink-400 text-white shrink-0 shadow-xs">
                  <Reply className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-[11px] font-bold text-pastel-pink-400 leading-tight">
                    Replying to {replyingTo.sender}
                  </span>
                  <span className="text-[11px] text-text-muted truncate max-w-xs sm:max-w-md">
                    {replyingTo.content || (replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'gif' ? '✨ GIF' : replyingTo.type === 'sticker' ? '🌸 Sticker' : 'Voice note')}
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
              className="absolute bottom-[80px] left-3 right-3 sm:left-6 sm:right-auto sm:w-96 bg-surface/98 md:backdrop-blur-xl border border-pastel-pink-300/40 rounded-[2rem] p-4 shadow-2xl z-30 flex flex-col gap-2"
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

        <div className="p-1 md:p-1.5 border border-pastel-pink-300/40 bg-surface/98 md:backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center relative z-20 overflow-hidden">
          
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                enterKeyHint="send"
                autoCapitalize="sentences"
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
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onTouchStart={(e) => {
                  // Prevent touch focus theft which dismisses iOS/Android virtual keyboard
                  e.preventDefault();
                  handleSendMessage();
                  chatInputRef.current?.focus();
                }}
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
              className="absolute bottom-[85px] left-3 right-3 sm:left-4 sm:right-4 bg-surface/98 md:backdrop-blur-xl border border-border rounded-[2.5rem] p-5 md:p-6 shadow-2xl z-30"
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
              className="w-full max-w-lg rounded-[2.5rem] bg-surface/98 md:backdrop-blur-xl border border-pastel-pink-300/40 shadow-2xl p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
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
