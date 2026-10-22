import React, { createContext, useContext } from 'react';
import { useScreenShare, type ActiveStreamDoc, type StreamViewMode } from '../hooks/useScreenShare';

export type ScreenShareContextType = ReturnType<typeof useScreenShare>;

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
