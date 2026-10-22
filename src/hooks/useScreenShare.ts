import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDocs, 
  deleteDoc, 
  addDoc,
  type Unsubscribe 
} from 'firebase/firestore';
import { firestoreDB } from '../firebase';

export interface ActiveStreamDoc {
  host: 'Mahad' | 'Ifa';
  status: 'offering' | 'connected' | 'ended';
  quality?: string;
  startedAt: number;
  endedAt?: number;
  micEnabled?: boolean;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]
};

export type StreamViewMode = 'theater' | 'pip' | 'fullscreen';

export function useScreenShare(currentUser: 'Mahad' | 'Ifa' | null) {
  const [activeStream, setActiveStream] = useState<ActiveStreamDoc | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [viewMode, setViewMode] = useState<StreamViewMode>('theater');
  const [error, setError] = useState<string | null>(null);

  // Check if browser supports screen sharing (desktop vs mobile)
  const canShareScreen = typeof navigator !== 'undefined' && 
    Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSenderRef = useRef<RTCRtpSender | null>(null);
  const unsubActiveDocRef = useRef<Unsubscribe | null>(null);
  const unsubCandidatesRef = useRef<Unsubscribe | null>(null);

  // Helper to safely clean up all ICE candidates in a subcollection
  const clearSubcollection = async (subcol: 'offerCandidates' | 'answerCandidates') => {
    try {
      const snap = await getDocs(collection(firestoreDB, 'streams', 'activeStream', subcol));
      const deletes = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (err) {
      console.warn(`[WebRTC] Failed to clear ${subcol}:`, err);
    }
  };

  // 1. Global listener for the activeStream document
  useEffect(() => {
    const streamDocRef = doc(firestoreDB, 'streams', 'activeStream');
    const unsub = onSnapshot(streamDocRef, (snap) => {
      if (!snap.exists()) {
        setActiveStream(null);
        return;
      }
      const data = snap.data() as ActiveStreamDoc;
      if (data.status === 'ended') {
        setActiveStream(null);
        if (isWatching || isStreaming) {
          teardown();
        }
      } else {
        setActiveStream(data);
      }
    }, (err) => {
      console.warn('[WebRTC] Stream doc snapshot error:', err);
    });

    return () => unsub();
  }, [isWatching, isStreaming]);

  // Teardown everything locally
  const teardown = useCallback(() => {
    if (unsubActiveDocRef.current) {
      unsubActiveDocRef.current();
      unsubActiveDocRef.current = null;
    }
    if (unsubCandidatesRef.current) {
      unsubCandidatesRef.current();
      unsubCandidatesRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    micSenderRef.current = null;

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsStreaming(false);
    setIsWatching(false);
    setIsMicOn(false);
    setConnectionState('closed');
  }, []);

  // 2. Host starts screen sharing (Nitro 1080p 60fps + system audio)
  const startScreenShare = useCallback(async () => {
    if (!currentUser) return;
    setError(null);

    if (!canShareScreen) {
      setError("Screen sharing isn't supported on mobile browsers. Please use a desktop browser to stream your screen.");
      return;
    }

    try {
      // High-profile capture constraints: 1080p 60fps with raw system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
          frameRate: { ideal: 60, max: 60 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      localStreamRef.current = displayStream;
      setLocalStream(displayStream);
      setIsStreaming(true);
      setViewMode('theater');

      // Native "Stop sharing" event listener
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        // High motion content hint for fast-paced video/movies
        videoTrack.contentHint = 'motion';
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      // Initialize RTCPeerConnection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      // Add display tracks to connection
      displayStream.getTracks().forEach(track => {
        pc.addTrack(track, displayStream);
      });

      // Nitro 8 Mbps / 60 FPS Bitrate Override
      const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (videoSender) {
        try {
          const params = videoSender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          params.encodings[0].maxBitrate = 8000000; // 8 Mbps
          params.encodings[0].maxFramerate = 60;
          await videoSender.setParameters(params);
        } catch (bitrateErr) {
          console.warn('[WebRTC] Bitrate boost error (non-fatal):', bitrateErr);
        }
      }

      // Clean up previous stream artifacts before posting new offer
      await clearSubcollection('offerCandidates');
      await clearSubcollection('answerCandidates');

      // Trickle ICE candidates to offerCandidates subcollection
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(
            collection(firestoreDB, 'streams', 'activeStream', 'offerCandidates'),
            event.candidate.toJSON()
          ).catch(e => console.warn('[WebRTC] ICE candidate write error:', e));
        }
      };

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const streamDocRef = doc(firestoreDB, 'streams', 'activeStream');
      const streamPayload: ActiveStreamDoc = {
        host: currentUser,
        status: 'offering',
        quality: '1080p 60fps',
        startedAt: Date.now(),
        micEnabled: false,
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      };
      await setDoc(streamDocRef, streamPayload);

      // Listen for Answer on activeStream doc
      unsubActiveDocRef.current = onSnapshot(streamDocRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as ActiveStreamDoc;
        if (data.answer && !pc.currentRemoteDescription) {
          const rtcSessionDesc = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(rtcSessionDesc).catch(err => {
            console.warn('[WebRTC] setRemoteDescription error on host:', err);
          });
        }
      });

      // Listen for remote answer ICE candidates
      unsubCandidatesRef.current = onSnapshot(
        collection(firestoreDB, 'streams', 'activeStream', 'answerCandidates'),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.addIceCandidate(candidate).catch(err => {
                console.warn('[WebRTC] addIceCandidate error on host:', err);
              });
            }
          });
        }
      );

    } catch (err: any) {
      console.error('[WebRTC] Screen share start error:', err);
      teardown();
      if (err.name !== 'NotAllowedError') {
        setError(err.message || 'Failed to start screen share.');
      }
    }
  }, [currentUser, canShareScreen, teardown]);

  // 3. Stop Screen Share (Host)
  const stopScreenShare = useCallback(async () => {
    try {
      const streamDocRef = doc(firestoreDB, 'streams', 'activeStream');
      await updateDoc(streamDocRef, {
        status: 'ended',
        endedAt: Date.now()
      }).catch(() => {});
      await clearSubcollection('offerCandidates');
      await clearSubcollection('answerCandidates');
    } catch (err) {
      console.warn('[WebRTC] Error during stream cleanup:', err);
    } finally {
      teardown();
    }
  }, [teardown]);

  // 4. Viewer Joins Active Stream
  const joinStream = useCallback(async () => {
    if (!activeStream || !activeStream.offer || isWatching || isStreaming) return;
    setError(null);

    try {
      setIsWatching(true);
      setViewMode('theater');

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      // Receive media tracks
      pc.ontrack = (event) => {
        setRemoteStream(prev => {
          if (!prev) {
            return event.streams[0] || new MediaStream([event.track]);
          }
          if (!prev.getTracks().find(t => t.id === event.track.id)) {
            prev.addTrack(event.track);
          }
          return new MediaStream(prev.getTracks());
        });
      };

      // Trickle ICE candidates to answerCandidates subcollection
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(
            collection(firestoreDB, 'streams', 'activeStream', 'answerCandidates'),
            event.candidate.toJSON()
          ).catch(e => console.warn('[WebRTC] Viewer ICE candidate write error:', e));
        }
      };

      // Set Remote Description from Offer
      await pc.setRemoteDescription(new RTCSessionDescription(activeStream.offer));

      // Create Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Post Answer to Firestore
      const streamDocRef = doc(firestoreDB, 'streams', 'activeStream');
      await updateDoc(streamDocRef, {
        status: 'connected',
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      });

      // Listen for remote offer ICE candidates
      unsubCandidatesRef.current = onSnapshot(
        collection(firestoreDB, 'streams', 'activeStream', 'offerCandidates'),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.addIceCandidate(candidate).catch(err => {
                console.warn('[WebRTC] Viewer addIceCandidate error:', err);
              });
            }
          });
        }
      );

      // Listen for stream end
      unsubActiveDocRef.current = onSnapshot(streamDocRef, (snap) => {
        if (!snap.exists()) {
          leaveStream();
          return;
        }
        const data = snap.data() as ActiveStreamDoc;
        if (data.status === 'ended') {
          leaveStream();
        }
      });

    } catch (err: any) {
      console.error('[WebRTC] Join stream error:', err);
      teardown();
      setError(err.message || 'Failed to join stream.');
    }
  }, [activeStream, isWatching, isStreaming, teardown]);

  // 5. Viewer Leaves Stream
  const leaveStream = useCallback(() => {
    teardown();
  }, [teardown]);

  // 6. Toggle Microphone
  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      // Turn off microphone
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (micSenderRef.current && pcRef.current) {
        try {
          pcRef.current.removeTrack(micSenderRef.current);
        } catch (e) {}
        micSenderRef.current = null;
      }
      setIsMicOn(false);

      if (isStreaming) {
        updateDoc(doc(firestoreDB, 'streams', 'activeStream'), { micEnabled: false }).catch(() => {});
      }
    } else {
      // Turn on microphone
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        micStreamRef.current = micStream;
        const micTrack = micStream.getAudioTracks()[0];

        if (pcRef.current && micTrack) {
          micSenderRef.current = pcRef.current.addTrack(micTrack, micStream);
        }
        setIsMicOn(true);

        if (isStreaming) {
          updateDoc(doc(firestoreDB, 'streams', 'activeStream'), { micEnabled: true }).catch(() => {});
        }
      } catch (err) {
        console.warn('[WebRTC] Microphone permission denied:', err);
        setError('Microphone access denied.');
      }
    }
  }, [isMicOn, isStreaming]);

  // 7. Mute / Unmute & Volume Controls
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    setNeedsAudioUnlock(false);
  }, []);

  const handleSetVolume = useCallback((newVol: number) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
    setNeedsAudioUnlock(false);
  }, [isMuted]);

  const unlockAudio = useCallback(() => {
    setIsMuted(false);
    setVolume(1);
    setNeedsAudioUnlock(false);
  }, []);

  return {
    activeStream,
    isStreaming,
    isWatching,
    canShareScreen,
    connectionState,
    localStream,
    remoteStream,
    isMicOn,
    volume,
    isMuted,
    needsAudioUnlock,
    viewMode,
    error,
    startScreenShare,
    stopScreenShare,
    joinStream,
    leaveStream,
    toggleMic,
    toggleMute,
    setVolume: handleSetVolume,
    unlockAudio,
    setViewMode,
    clearError: () => setError(null)
  };
}
