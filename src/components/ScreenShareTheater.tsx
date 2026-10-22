import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  PhoneOff, 
  Volume1, 
  Sparkles, 
  Radio, 
  Move,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import type { StreamViewMode, ActiveStreamDoc } from '../hooks/useScreenShare';

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
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
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
  isWatching,
  localStream,
  remoteStream,
  isMicOn,
  volume,
  isMuted,
  viewMode,
  error,
  onStop,
  onLeave,
  onToggleMic,
  onToggleMute,
  onSetVolume,
  onSetViewMode,
  onClearError
}: ScreenShareTheaterProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeMediaStream = isStreaming ? localStream : remoteStream;
  const hostName = activeStream?.host || (isStreaming ? currentUser : 'Mahad');
  const isHostMahad = hostName === 'Mahad';

  // Attach active MediaStream to video element
  useEffect(() => {
    if (!videoRef.current) return;

    if (activeMediaStream) {
      videoRef.current.srcObject = activeMediaStream;

      // Host must be muted locally to prevent feedback loop
      if (isStreaming) {
        videoRef.current.muted = true;
      } else {
        videoRef.current.muted = isMuted;
        videoRef.current.volume = volume;

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[ScreenShare] Autoplay was blocked:', err);
            setAudioAutoplayBlocked(true);
          });
        }
      }
    } else {
      videoRef.current.srcObject = null;
    }
  }, [activeMediaStream, isStreaming, isMuted, volume]);

  // Handle viewer volume adjustments
  useEffect(() => {
    if (videoRef.current && !isStreaming) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted, isStreaming]);

  // Track native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs && viewMode === 'fullscreen') {
        onSetViewMode('theater');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [viewMode, onSetViewMode]);

  // Toggle true fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('[ScreenShare] Fullscreen error:', err);
    }
  };

  // Auto-hide controls when mouse is still in theater/fullscreen mode
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  const handleUnmuteClick = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
    setAudioAutoplayBlocked(false);
    if (isMuted) onToggleMute();
  };

  // 1. FLOATING PIP MINI-PLAYER (Mounted across tabs or when minimized)
  if (viewMode === 'pip') {
    return (
      <motion.div
        drag
        dragConstraints={{ left: -window.innerWidth + 320, right: 20, top: -window.innerHeight + 240, bottom: 20 }}
        dragElastic={0.15}
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 30 }}
        transition={springBezier}
        className="fixed bottom-6 right-6 z-[80] w-72 sm:w-80 rounded-[28px] overflow-hidden clay-card shadow-2xl border-2 border-pastel-pink-400/40 bg-black/90 cursor-grab active:cursor-grabbing select-none group"
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
            ref={videoRef}
            autoPlay
            playsInline
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
          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
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

  // 2. EXPANSIVE THEATER & FULLSCREEN MODE
  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      initial={{ opacity: 0, y: -15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={springBezier}
      className={`relative w-full rounded-[32px] overflow-hidden clay-card shadow-2xl border border-pastel-pink-300/30 bg-black flex flex-col group select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-none max-h-screen' : 'mb-4 max-h-[70vh] sm:max-h-[75vh]'
      }`}
    >
      {/* Top Floating Info Bar (Visible on Hover/Interaction) */}
      <div 
        className={`absolute top-0 inset-x-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {/* Live Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-red-500/40 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-red-400">
              LIVE
            </span>
            <span className="text-[10px] font-bold text-white/80 bg-white/10 px-1.5 py-0.5 rounded-md">
              1080p 60FPS
            </span>
          </div>

          {/* Host Avatar Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-xs">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              isHostMahad 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700' 
                : 'bg-gradient-to-br from-rose-500 to-pink-600'
            }`}>
              {isHostMahad ? 'M' : 'I'}
            </div>
            <span>{isStreaming ? `You (${currentUser})` : `${hostName}'s Stream`}</span>
            <span>{isHostMahad ? '🌹' : '🌷'}</span>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <button
              onClick={() => onSetViewMode('pip')}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 interactive-spring"
              title="Minimize to Floating PiP"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Minimize</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white cursor-pointer transition-all interactive-spring"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Video Canvas */}
      <div className="relative w-full aspect-video flex-1 bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
          onClick={handleUserActivity}
        />

        {/* Tap to Unmute Overlay if Autoplay blocked audio */}
        {audioAutoplayBlocked && !isStreaming && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4"
          >
            <button
              onClick={handleUnmuteClick}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-pastel-pink-500 to-pastel-pink-400 text-white font-bold text-sm shadow-xl flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all cursor-pointer glow-rose-sm"
            >
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span>Tap to Unmute Audio 🔊</span>
            </button>
            <span className="text-xs text-white/70 font-medium">
              Browser muted the stream until you tap to listen
            </span>
          </motion.div>
        )}

        {/* Error Notification Banner */}
        {error && (
          <div className="absolute top-16 inset-x-4 z-30 flex items-center justify-between p-3 rounded-2xl bg-red-950/80 border border-red-500/50 backdrop-blur-md text-red-200 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={onClearError} className="p-1 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Tactile Controls Bar (44x44px touch targets) */}
      <div 
        className={`absolute bottom-3 sm:bottom-4 inset-x-0 z-30 flex justify-center px-3 sm:px-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-[26px] bg-surface/90 dark:bg-black/85 backdrop-blur-2xl border border-white/20 shadow-2xl">
          {/* Microphone Toggle (Talk while watching) */}
          <button
            onClick={onToggleMic}
            className={`min-w-[44px] min-h-[44px] px-3.5 rounded-full flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              isMicOn
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400/40'
                : 'bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/40'
            } active:scale-90`}
            title={isMicOn ? 'Mute Microphone' : 'Talk with Partner (Mic On)'}
          >
            {isMicOn ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden xs:inline">{isMicOn ? 'Mic Live' : 'Mic Off'}</span>
          </button>

          {/* Volume / Mute controls for viewer */}
          {!isStreaming && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-hover/70 border border-border/30">
              <button
                onClick={onToggleMute}
                className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-text-muted hover:text-text-main cursor-pointer active:scale-90 transition-transform"
                title={isMuted ? 'Unmute stream' : 'Mute stream'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4 text-pastel-pink-400" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-pastel-pink-500 cursor-pointer h-1.5 rounded-lg"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>
          )}

          {/* Minimize Button */}
          {!isFullscreen && (
            <button
              onClick={() => onSetViewMode('pip')}
              className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/40 cursor-pointer active:scale-90 transition-transform"
              title="Minimize to Floating PiP"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/40 cursor-pointer active:scale-90 transition-transform"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* End / Leave Stream Button (Red Squishy Clay) */}
          <button
            onClick={isStreaming ? onStop : onLeave}
            className="min-w-[44px] min-h-[44px] px-4 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">{isStreaming ? 'End Stream' : 'Leave'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
