import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, type Transition } from 'framer-motion';
import { 
  Maximize2, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  ShieldAlert
} from 'lucide-react';
import type { StreamViewMode, ActiveStreamDoc } from '../hooks/useScreenShare';
import { useScreenShareContext } from '../context/ScreenShareContext';

const springBezier: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 25,
  mass: 0.8
};

interface ScreenShareTheaterProps {
  currentUser: 'Mahad' | 'Ifa';
  activeStream: ActiveStreamDoc | null;
  isStreaming: boolean;
  isWatching: boolean;
  attachVideoStream: (el: HTMLVideoElement | null) => void;
  streamTick?: number;
  isMicOn: boolean;
  volume: number;
  isMuted: boolean;
  viewMode: StreamViewMode;
  error: string | null;
  onStop: () => void;
  onLeave: () => void;
  onToggleMic: () => void;
  onToggleMute: () => void;
  onSetVolume: (vol: number) => void;
  onSetViewMode: (mode: StreamViewMode) => void;
  onClearError: () => void;
}

export default function ScreenShareTheater({
  currentUser,
  activeStream,
  isStreaming,
  attachVideoStream,
  streamTick,
  isMicOn,
  volume,
  isMuted,
  onStop,
  onLeave,
  onToggleMic,
  onToggleMute,
  onSetViewMode
}: ScreenShareTheaterProps) {
  const { getActiveMediaStream } = useScreenShareContext();
  const videoNodeRef = useRef<HTMLVideoElement | null>(null);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);

  const hostName = activeStream?.host || (isStreaming ? currentUser : 'Mahad');
  const isHostMahad = hostName === 'Mahad';

  // Callback Ref Pattern for reliable instant video attachment
  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoNodeRef.current = node;
    if (!node) return;

    node.setAttribute('playsinline', 'true');
    node.setAttribute('webkit-playsinline', 'true');
    node.setAttribute('x5-playsinline', 'true');
    node.playsInline = true;

    const stream = getActiveMediaStream();
    if (stream) {
      if (node.srcObject !== stream) {
        node.srcObject = stream;
      }
      if (isStreaming) {
        node.muted = true;
      } else {
        node.muted = isMuted;
        node.volume = volume;
      }
      const playPromise = node.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[PiP] Autoplay was blocked, muting to start video:', err);
          if (!isStreaming) {
            node.muted = true;
            node.play().catch(() => {});
            setAudioAutoplayBlocked(true);
          }
        });
      }
    }
  }, [getActiveMediaStream, isStreaming, isMuted, volume, streamTick]);

  useEffect(() => {
    if (videoNodeRef.current) {
      attachVideoRef(videoNodeRef.current);
    }
  }, [attachVideoRef, streamTick, isStreaming, isMuted, volume]);

  const handleUnmuteClick = () => {
    if (videoNodeRef.current) {
      videoNodeRef.current.muted = false;
      videoNodeRef.current.volume = 1.0;
      videoNodeRef.current.play().catch(() => {});
    }
    setAudioAutoplayBlocked(false);
    if (isMuted) onToggleMute();
  };

  // Draggable Floating PiP Mini-Player
  return (
    <motion.div
      drag
      dragConstraints={{ left: -window.innerWidth + 320, right: 20, top: -window.innerHeight + 240, bottom: 20 }}
      dragElastic={0.15}
      initial={{ scale: 0.8, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: 30 }}
      transition={springBezier}
      className="fixed bottom-6 right-6 z-[80] w-72 sm:w-80 rounded-[28px] overflow-hidden clay-card shadow-2xl border-2 border-pastel-pink-400/40 bg-black/95 cursor-grab active:cursor-grabbing select-none group"
      style={{ touchAction: 'none' }}
    >
      {/* Header Drag Handle */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-surface/90 backdrop-blur-md border-b border-white/10 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400">
            LIVE 1080p
          </span>
          <span className="text-[10px] text-text-muted font-medium">
            • {hostName} {isHostMahad ? '🌹' : '🌷'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onSetViewMode('theater')}
            className="p-1.5 rounded-full hover:bg-white/20 text-white cursor-pointer transition-colors"
            title="Expand to Theater Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={isStreaming ? onStop : onLeave}
            className="p-1.5 rounded-full hover:bg-red-500/30 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
            title={isStreaming ? 'End Stream' : 'Leave Stream'}
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Surface */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={attachVideoRef}
          autoPlay
          playsInline
          webkit-playsinline="true"
          muted={isStreaming ? true : isMuted}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Unmute overlay for blocked audio */}
        {audioAutoplayBlocked && !isStreaming && (
          <button
            onClick={handleUnmuteClick}
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white p-2 cursor-pointer z-20"
          >
            <VolumeX className="w-6 h-6 text-pastel-pink-400 animate-bounce" />
            <span className="text-[11px] font-bold">Tap to Unmute Audio 🔊</span>
          </button>
        )}

        {/* Quick Hover Controls Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
          <button
            onClick={onToggleMic}
            className={`p-1.5 rounded-full cursor-pointer transition-colors ${
              isMicOn ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
          >
            {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          {!isStreaming && (
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 cursor-pointer transition-colors"
              title={isMuted ? 'Unmute Stream' : 'Mute Stream'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => onSetViewMode('theater')}
            className="px-2.5 py-1 rounded-full bg-pastel-pink-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm hover:brightness-110 cursor-pointer flex items-center gap-1"
          >
            <span>Theater</span>
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
