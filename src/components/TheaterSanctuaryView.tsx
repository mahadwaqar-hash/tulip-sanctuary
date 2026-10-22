import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Tv, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Volume1, 
  PhoneOff, 
  Radio, 
  Film, 
  Popcorn, 
  Info, 
  MapPin, 
  ShieldAlert, 
  Heart,
  CheckCircle2
} from 'lucide-react';
import { useScreenShareContext } from '../context/ScreenShareContext';
import { useFirestore } from '../firebase';
import StreamChatOverlay from './StreamChatOverlay';

const springBezier: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 25,
  mass: 0.8
};

interface TheaterSanctuaryViewProps {
  currentUser: 'Mahad' | 'Ifa';
}

export default function TheaterSanctuaryView({ currentUser }: TheaterSanctuaryViewProps) {
  const {
    activeStream,
    isStreaming,
    isWatching,
    canShareScreen,
    streamTick,
    attachVideoStream,
    getActiveMediaStream,
    isMicOn,
    volume,
    isMuted,
    error,
    startScreenShare,
    stopScreenShare,
    joinStream,
    leaveStream,
    toggleMic,
    toggleMute,
    setVolume,
    clearError,
    setViewMode
  } = useScreenShareContext();

  const videoNodeRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Partner presence to show online status in Cinema Lounge
  const partnerName = currentUser === 'Mahad' ? 'Ifa' : 'Mahad';
  const presenceList = useFirestore<any>('presence', 'id', false) || [];
  const partnerPresence = presenceList.find((p) => p.id === partnerName);
  const isPartnerOnline = Boolean(
    partnerPresence?.online && 
    (Date.now() - (partnerPresence.lastSeen || 0) < 300000)
  );

  const isStreamActive = (isStreaming || isWatching) && activeStream?.status !== 'ended';
  const hostName = activeStream?.host || (isStreaming ? currentUser : 'Mahad');
  const isHostMahad = hostName === 'Mahad';
  const isPartnerStreaming = Boolean(
    activeStream && 
    activeStream.status !== 'ended' && 
    activeStream.host !== currentUser && 
    !isWatching && 
    !isStreaming
  );

  // Callback Ref Pattern: immediately sets srcObject and plays the instant <video> mounts
  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoNodeRef.current = node;
    if (!node) return;

    const stream = getActiveMediaStream();
    if (stream) {
      if (node.srcObject !== stream) {
        node.srcObject = stream;
      }
      if (isStreaming) {
        node.muted = true;
        node.play().catch(() => {});
      } else {
        node.muted = isMuted;
        node.volume = volume;
        const playPromise = node.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[Theater] Autoplay with audio was restricted, muting to start video playback:', err);
            // CRITICAL MOBILE FIX: If browser blocks unmuted audio autoplay, immediately mute and play
            // so video NEVER stays blank or frozen!
            node.muted = true;
            node.play().catch(e => console.error('[Theater] Muted play failed:', e));
            setAudioAutoplayBlocked(true);
          });
        }
      }
    }
  }, [getActiveMediaStream, isStreaming, isMuted, volume, streamTick]);

  // Synchronize playback properties when stream or volume state updates
  useEffect(() => {
    if (videoNodeRef.current) {
      attachVideoRef(videoNodeRef.current);
    }
  }, [attachVideoRef, streamTick, isStreamActive, isStreaming, isMuted, volume]);

  // Direct viewer join action: unmutes immediately with direct user interaction
  const handleJoinStream = async () => {
    // Pre-activate unmuted audio playback synchronously in direct tap gesture
    if (videoNodeRef.current) {
      videoNodeRef.current.muted = false;
      videoNodeRef.current.volume = 1.0;
      videoNodeRef.current.play().catch(() => {});
    }
    if (isMuted) toggleMute();
    setVolume(1.0);
    await joinStream();
  };

  const handleUnmuteClick = () => {
    if (videoNodeRef.current) {
      videoNodeRef.current.muted = false;
      videoNodeRef.current.volume = 1.0;
      videoNodeRef.current.play().catch(() => {});
    }
    setAudioAutoplayBlocked(false);
    if (isMuted) toggleMute();
    setVolume(1.0);
  };

  // Track Fullscreen (Desktop + iOS Safari fallback)
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);

    const videoEl = videoNodeRef.current;
    const onWebkitBegin = () => setIsFullscreen(true);
    const onWebkitEnd = () => setIsFullscreen(false);
    if (videoEl) {
      videoEl.addEventListener('webkitbeginfullscreen', onWebkitBegin);
      videoEl.addEventListener('webkitendfullscreen', onWebkitEnd);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      if (videoEl) {
        videoEl.removeEventListener('webkitbeginfullscreen', onWebkitBegin);
        videoEl.removeEventListener('webkitendfullscreen', onWebkitEnd);
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if (videoNodeRef.current && (videoNodeRef.current as any).webkitEnterFullscreen) {
          (videoNodeRef.current as any).webkitEnterFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('[Theater] Fullscreen error:', err);
    }
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      {/* 1. CINEMA LOUNGE (EMPTY / READY STATE) */}
      {!isStreamActive && (
        <div className="w-full h-full overflow-y-auto no-scrollbar py-2 sm:py-4 px-2 sm:px-4 max-w-5xl mx-auto flex flex-col gap-3 sm:gap-6 pb-24 sm:pb-8">
          
          {/* TOP PRIORITY ON MOBILE: PARTNER IS STREAMING - JOIN TICKET BANNER */}
          {isPartnerStreaming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={springBezier}
              className="p-5 sm:p-8 rounded-3xl sm:rounded-[36px] bg-gradient-to-r from-pastel-pink-500/25 via-rose-500/30 to-pastel-pink-500/25 border-2 border-pastel-pink-400/80 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-red-500/20 text-red-500 border border-red-500/40 flex items-center justify-center shrink-0 shadow-lg">
                  <Radio className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse text-red-500" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-red-400">
                      LIVE NOW • 1080p 60FPS
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-text-main font-serif-italic mt-0.5 truncate">
                    {activeStream?.host === 'Mahad' ? '🌹 Mahad' : '🌷 Ifa'} is streaming live!
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5 sm:mt-1 leading-snug">
                    Join now to watch together in synchrony with live audio.
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={springBezier}
                onClick={handleJoinStream}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-pastel-pink-500 via-rose-500 to-pastel-pink-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl hover:brightness-110 cursor-pointer flex items-center justify-center gap-2.5 shrink-0 glow-rose-sm"
              >
                <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Join Cinema Stream 🍿</span>
              </motion.button>
            </motion.div>
          )}

          {/* Header Title Card */}
          <div className="p-4 sm:p-8 rounded-3xl sm:rounded-[36px] clay-card bg-surface/80 border border-pastel-pink-300/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative overflow-hidden">
            <div className="flex flex-col gap-1 z-10">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-pastel-pink-500/15 border border-pastel-pink-500/30 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-pastel-pink-500 w-fit">
                <Popcorn className="w-3.5 h-3.5" />
                <span>Our Private Cinema</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold font-serif-italic text-text-main tracking-tight mt-1">
                A.I.M. Theater 🍿
              </h2>
              <p className="text-xs sm:text-sm text-text-muted font-medium max-w-xl leading-relaxed">
                Stream your screen, movies, TV shows, and anime in crystal clear 1080p 60FPS Nitro quality with full system audio.
              </p>
            </div>

            {/* Partner Presence Card */}
            <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-surface-hover/80 border border-border/50 shadow-xs z-10 shrink-0">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold text-white shadow-md ${
                  partnerName === 'Mahad'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                    : 'bg-gradient-to-br from-rose-500 to-pink-600'
                }`}
              >
                {partnerName === 'Mahad' ? 'M' : 'I'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                  <span>{partnerName}</span>
                  <span>{partnerName === 'Mahad' ? '🌹' : '🌷'}</span>
                </span>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted mt-0.5">
                  {isPartnerOnline ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                      <span className="text-emerald-500 font-bold">Online Now</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                      <span>{partnerPresence?.lastSeen ? 'Recently Active' : 'Offline'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN START SCREEN SHARE ACTION CARD (DESKTOP) */}
          {!isPartnerStreaming && canShareScreen && (
            <div className="p-5 sm:p-12 rounded-3xl sm:rounded-[40px] clay-card bg-surface/90 border border-pastel-pink-300/30 shadow-2xl flex flex-col items-center text-center gap-4 sm:gap-6 relative overflow-hidden">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] sm:rounded-[28px] bg-gradient-to-br from-pastel-pink-400 to-rose-500 text-white flex items-center justify-center shadow-xl glow-rose-sm">
                <Film className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div className="max-w-md">
                <h3 className="text-xl sm:text-3xl font-bold font-serif-italic text-text-main">
                  Ready for Movie Night?
                </h3>
                <p className="text-xs sm:text-sm text-text-muted font-medium mt-1.5 sm:mt-2 leading-relaxed">
                  Start streaming your screen, windows, or browser tabs. Fast-moving movies and high-framerate anime will transmit smoothly at 60 frames per second.
                </p>
              </div>

              {/* Start Button */}
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={springBezier}
                onClick={startScreenShare}
                className="w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-5 rounded-full bg-gradient-to-r from-pastel-pink-500 via-rose-500 to-pastel-pink-500 text-white font-black text-xs sm:text-base uppercase tracking-wider shadow-2xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 sm:gap-3 glow-rose-sm text-center"
              >
                <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Start 1080p 60fps Screen Share 🖥️</span>
              </motion.button>

              {/* Audio Instructions Tip */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-hover/80 border border-border/50 max-w-lg flex items-start gap-2.5 sm:gap-3 text-left mt-1 sm:mt-2">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-pastel-pink-500 shrink-0 mt-0.5" />
                <div className="flex flex-col text-[11px] sm:text-xs text-text-muted leading-relaxed">
                  <strong className="text-text-main font-bold">How to share audio:</strong>
                  When your browser displays the sharing dialog, choose <span className="text-pastel-pink-500 font-semibold">"Chrome Tab"</span> or <span className="text-pastel-pink-500 font-semibold">"Entire Screen"</span> and make sure the <span className="text-pastel-pink-500 font-semibold">"Share audio"</span> checkbox is ticked!
                </div>
              </div>
            </div>
          )}

          {/* MOBILE VIEWER MODE (When on phone and partner is not yet streaming) */}
          {!isPartnerStreaming && !canShareScreen && (
            <div className="p-5 sm:p-10 rounded-3xl sm:rounded-[36px] clay-card bg-surface/90 border border-pastel-pink-300/30 shadow-2xl flex flex-col items-center text-center gap-3.5 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] sm:rounded-[24px] bg-gradient-to-br from-pastel-pink-400 to-rose-500 text-white flex items-center justify-center shadow-xl glow-rose-sm">
                <Popcorn className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="max-w-md">
                <span className="inline-block px-3 py-1 rounded-full bg-pastel-pink-100/60 dark:bg-pastel-pink-400/20 text-pastel-pink-500 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 sm:mb-2">
                  Mobile Cinema Mode 📱
                </span>
                <h3 className="text-lg sm:text-2xl font-bold font-serif-italic text-text-main">
                  Ready to Watch Together
                </h3>
                <p className="text-xs sm:text-sm text-text-muted font-medium mt-1 leading-relaxed">
                  Mobile browsers cannot broadcast screens, but as soon as {partnerName} starts streaming from desktop, a glowing ticket pops up right here so you can watch together in 1080p 60FPS!
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-text-muted bg-surface-hover/80 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border/50">
                <span className={`w-2 h-2 rounded-full ${isPartnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                <span>{isPartnerOnline ? `${partnerName} is online` : `${partnerName} is currently offline`}</span>
              </div>
            </div>
          )}

          {/* Error Message Pill */}
          {error && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="p-1 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. ACTIVE STREAM STAGE (THEATER MODE) */}
      {isStreamActive && (
        <div
          ref={containerRef}
          onMouseMove={handleUserActivity}
          onTouchStart={handleUserActivity}
          className={`relative w-full h-full flex flex-col justify-center items-center bg-black transition-all duration-300 ${
            isFullscreen ? 'fixed inset-0 z-[100]' : 'p-0 sm:p-4'
          }`}
        >
          {/* Cinema Frame */}
          <div
            className={`relative w-full h-full max-w-6xl rounded-none sm:rounded-[36px] overflow-hidden clay-card sm:shadow-[0_0_60px_rgba(244,63,94,0.25)] sm:border-2 sm:border-pastel-pink-400/40 bg-black flex items-center justify-center ${
              isFullscreen ? 'max-w-none rounded-none border-none shadow-none' : ''
            }`}
          >
            {/* Primary Video Canvas with Callback Ref Pattern */}
            <video
              ref={attachVideoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
              controls={false}
              muted={isStreaming ? true : isMuted}
              className="w-full h-full object-contain cursor-default"
              onClick={handleUserActivity}
            />

            {/* Unmute Autoplay Blocked Banner */}
            {audioAutoplayBlocked && !isStreaming && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-4 select-none"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={springBezier}
                  onClick={handleUnmuteClick}
                  className="px-6 py-3.5 sm:px-7 sm:py-4 rounded-full bg-gradient-to-r from-pastel-pink-500 via-rose-500 to-pastel-pink-500 text-white font-black text-xs sm:text-base shadow-2xl flex items-center gap-2.5 sm:gap-3 hover:brightness-110 active:scale-95 transition-all cursor-pointer glow-rose-sm border-2 border-white/50 animate-pulse text-center"
                >
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  <span>🔊 Tap to Unmute Stream Audio</span>
                </motion.button>
                <span className="text-[11px] sm:text-xs text-white/80 font-medium bg-black/60 px-3.5 py-1 rounded-full border border-white/10 text-center">
                  Browser paused audio until you tap here
                </span>
              </motion.div>
            )}

            {/* Top Info Bar (AutoHide) */}
            <div
              className={`absolute top-0 inset-x-0 z-30 p-2 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {/* Live Indicator */}
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-red-500/40 shadow-sm">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-red-400">
                    LIVE
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-white/80 bg-white/10 px-1 sm:px-1.5 py-0.5 rounded-md">
                    1080p 60FPS
                  </span>
                </div>

                {/* Host Pill */}
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] sm:text-xs font-semibold shadow-xs">
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white ${
                      isHostMahad
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                        : 'bg-gradient-to-br from-rose-500 to-pink-600'
                    }`}
                  >
                    {isHostMahad ? 'M' : 'I'}
                  </div>
                  <span className="truncate max-w-[85px] sm:max-w-none">{isStreaming ? `You (${currentUser})` : `${hostName}'s Stream`}</span>
                  <span>{isHostMahad ? '🌹' : '🌷'}</span>
                </div>
              </div>

              {/* View Modes */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {!isFullscreen && (
                  <button
                    onClick={() => setViewMode('pip')}
                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 interactive-spring"
                    title="Minimize to Floating PiP"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Mini PiP</span>
                  </button>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white cursor-pointer transition-all interactive-spring"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LIVE FLOATING CHAT BUBBLE OVERLAY */}
            <StreamChatOverlay
              currentUser={currentUser}
              streamStartTime={activeStream?.startedAt || Date.now()}
            />

            {/* Bottom Floating Tactile Controls Dock */}
            <div
              className={`absolute bottom-2 sm:bottom-5 inset-x-0 z-30 flex justify-center px-2 sm:px-4 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2.5 rounded-full sm:rounded-[28px] bg-surface/95 dark:bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl max-w-[calc(100vw-16px)]">
                {/* Microphone Toggle */}
                <button
                  onClick={toggleMic}
                  className={`min-w-[42px] min-h-[42px] sm:min-w-[44px] sm:min-h-[44px] px-2.5 sm:px-3.5 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isMicOn
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400/40'
                      : 'bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/40'
                  } active:scale-90`}
                  title={isMicOn ? 'Mute Microphone' : 'Unmute Mic (Talk with partner)'}
                >
                  {isMicOn ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isMicOn ? 'Mic Live' : 'Mic Off'}</span>
                </button>

                {/* Volume / Mute for viewer */}
                {!isStreaming && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2.5 py-1 rounded-full bg-surface-hover/70 border border-border/30">
                    <button
                      onClick={toggleMute}
                      className="min-w-[42px] min-h-[42px] sm:min-w-[40px] sm:min-h-[40px] rounded-full flex items-center justify-center text-text-muted hover:text-text-main cursor-pointer active:scale-90 transition-transform"
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
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="hidden sm:block w-16 sm:w-24 accent-pastel-pink-500 cursor-pointer h-1.5 rounded-lg"
                      title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                    />
                  </div>
                )}

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="min-w-[42px] min-h-[42px] sm:min-w-[44px] sm:min-h-[44px] rounded-full flex items-center justify-center bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/40 cursor-pointer active:scale-90 transition-transform"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* End / Leave Stream Button */}
                <button
                  onClick={isStreaming ? stopScreenShare : leaveStream}
                  className="min-w-[42px] min-h-[42px] sm:min-w-[44px] sm:min-h-[44px] px-3 sm:px-4 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span className="hidden sm:inline">{isStreaming ? 'End Stream' : 'Leave'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
