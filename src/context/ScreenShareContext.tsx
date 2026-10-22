import React, { createContext, useContext, useMemo } from 'react';
import { useScreenShare, type ActiveStreamDoc, type StreamViewMode } from '../hooks/useScreenShare';

interface ScreenShareContextType {
  activeStream: ActiveStreamDoc | null;
  isStreaming: boolean;
  isWatching: boolean;
  canShareScreen: boolean;
  connectionState: RTCPeerConnectionState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicOn: boolean;
  volume: number;
  isMuted: boolean;
  needsAudioUnlock: boolean;
  viewMode: StreamViewMode;
  error: string | null;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  joinStream: () => Promise<void>;
  leaveStream: () => void;
  toggleMic: () => Promise<void>;
  toggleMute: () => void;
  setVolume: (vol: number) => void;
  unlockAudio: () => void;
  setViewMode: (mode: StreamViewMode) => void;
  clearError: () => void;
}

const ScreenShareContext = createContext<ScreenShareContextType | null>(null);

export function ScreenShareProvider({ 
  currentUser, 
  children 
}: { 
  currentUser: 'Mahad' | 'Ifa' | null; 
  children: React.ReactNode 
}) {
  const screenShare = useScreenShare(currentUser);

  return (
    <ScreenShareContext.Provider value={screenShare}>
      {children}
    </ScreenShareContext.Provider>
  );
}

export function useScreenShareContext() {
  const context = useContext(ScreenShareContext);
  if (!context) {
    throw new Error('useScreenShareContext must be used within a ScreenShareProvider');
  }
  return context;
}
