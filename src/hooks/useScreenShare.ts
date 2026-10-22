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
  const [isMicOn, setIsMicOn] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [viewMode, setViewMode] = useState<StreamViewMode>('theater');
  const [error, setError] = useState<string | null>(null);
  const [streamTick, setStreamTick] = useState(0);

  // Check if browser supports screen sharing (desktop vs mobile)
  const canShareScreen = typeof navigator !== 'undefined' && 
    Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function');

  // CRITICAL FIX 1: All WebRTC & MediaStream objects strictly stored in REFS (NEVER in useState)
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSenderRef = useRef<RTCRtpSender | null>(null);
  
  // CRITICAL FIX 2: State Tracking & Early ICE Candidate Queue
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const isRemoteDescriptionSetRef = useRef<boolean>(false);
  const isStreamingRef = useRef<boolean>(false);
  const isWatchingRef = useRef<boolean>(false);
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

  // Safe Bitrate Boost (Only applied inside try/catch when encodings exist and connection is ready)
  const applySafeBitrateBoost = useCallback(async (pc: RTCPeerConnection) => {
    try {
      const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (videoSender) {
        const params = videoSender.getParameters();
        if (params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = 8000000; // 8 Mbps Nitro Quality
          params.encodings[0].maxFramerate = 60;
          await videoSender.setParameters(params);
        }
      }
    } catch (err) {
      console.warn('[WebRTC] Bitrate boost skipped (non-fatal):', err);
    }
  }, []);

  // Flush queued early ICE candidates after setRemoteDescription has resolved
  const flushIceCandidateQueue = useCallback(async (pc: RTCPeerConnection) => {
    while (iceCandidateQueueRef.current.length > 0) {
      const candidateInit = iceCandidateQueueRef.current.shift();
      if (candidateInit && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch (err) {
          console.warn('[WebRTC] Error adding queued ICE candidate (non-fatal):', err);
        }
      }
    }
  }, []);

  // Handle incoming candidate with queue protection
  const handleIncomingCandidate = useCallback(async (candidateData: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    if (!isRemoteDescriptionSetRef.current || !pc.remoteDescription) {
      iceCandidateQueueRef.current.push(candidateData);
    } else {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      } catch (err) {
        console.warn('[WebRTC] addIceCandidate error (non-fatal):', err);
      }
    }
  }, []);

  // Teardown everything locally with complete cleanup
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
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(t => t.stop());
      remoteStreamRef.current = null;
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
      try {
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }

    iceCandidateQueueRef.current = [];
    isRemoteDescriptionSetRef.current = false;
    isStreamingRef.current = false;
    isWatchingRef.current = false;

    setIsStreaming(false);
    setIsWatching(false);
    setIsMicOn(false);
    setConnectionState('closed');
    setStreamTick(t => t + 1);
  }, []);

  // CRITICAL FIX 3: Stable Firestore listener with empty dependency array []
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
        if (isWatchingRef.current || isStreamingRef.current) {
          teardown();
        }
      } else {
        setActiveStream(data);
      }
    }, (err) => {
      console.warn('[WebRTC] Stream doc snapshot error:', err);
    });

    return () => unsub();
  }, [teardown]);

  // Host starts 1080p 60fps screen share
  const startScreenShare = useCallback(async () => {
    if (!currentUser) return;
    setError(null);

    if (!canShareScreen) {
      setError("Screen sharing isn't supported on mobile browsers. Please use a desktop browser to stream your screen.");
      return;
    }

    try {
      // High-profile capture: 1080p 60fps + raw uncompressed system audio
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
      isStreamingRef.current = true;
      isWatchingRef.current = false;
      isRemoteDescriptionSetRef.current = false;
      iceCandidateQueueRef.current = [];

      setIsStreaming(true);
      setIsWatching(false);
      setViewMode('theater');
      setStreamTick(t => t + 1);

      // Native browser "Stop sharing" ribbon listener
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.contentHint = 'motion';
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === 'connected') {
          applySafeBitrateBoost(pc);
        }
      };

      // Add display tracks to RTCPeerConnection
      displayStream.getTracks().forEach(track => {
        pc.addTrack(track, displayStream);
      });

      // Clear previous candidates before posting new offer
      await clearSubcollection('offerCandidates');
      await clearSubcollection('answerCandidates');

      // Trickle ICE candidates
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

      // CRITICAL FIX 4: Guarded Answer Listener (Strict check on signalingState)
      unsubActiveDocRef.current = onSnapshot(streamDocRef, async (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as ActiveStreamDoc;
        const currentPc = pcRef.current;
        if (!currentPc) return;

        if (
          data.answer && 
          !isRemoteDescriptionSetRef.current && 
          currentPc.signalingState === 'have-local-offer'
        ) {
          try {
            isRemoteDescriptionSetRef.current = true;
            const rtcSessionDesc = new RTCSessionDescription(data.answer);
            await currentPc.setRemoteDescription(rtcSessionDesc);
            await flushIceCandidateQueue(currentPc);
          } catch (err) {
            console.warn('[WebRTC] Host setRemoteDescription error:', err);
          }
        }
      });

      // Listen for remote answer candidates with queue flushing
      unsubCandidatesRef.current = onSnapshot(
        collection(firestoreDB, 'streams', 'activeStream', 'answerCandidates'),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              handleIncomingCandidate(change.doc.data());
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
  }, [currentUser, canShareScreen, teardown, applySafeBitrateBoost, flushIceCandidateQueue, handleIncomingCandidate]);

  // Host stops stream
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
      console.warn('[WebRTC] Stream cleanup error:', err);
    } finally {
      teardown();
    }
  }, [teardown]);

  // Viewer joins active stream
  const joinStream = useCallback(async () => {
    if (!activeStream || !activeStream.offer || isWatchingRef.current || isStreamingRef.current) return;
    setError(null);

    try {
      isWatchingRef.current = true;
      isStreamingRef.current = false;
      isRemoteDescriptionSetRef.current = false;
      iceCandidateQueueRef.current = [];

      setIsWatching(true);
      setIsStreaming(false);
      setViewMode('theater');

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      // Receive media tracks and store in remoteStreamRef
      pc.ontrack = (event) => {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = event.streams[0] || new MediaStream([event.track]);
        } else {
          if (!remoteStreamRef.current.getTracks().find(t => t.id === event.track.id)) {
            remoteStreamRef.current.addTrack(event.track);
          }
        }
        setStreamTick(t => t + 1);
      };

      // Trickle answer candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(
            collection(firestoreDB, 'streams', 'activeStream', 'answerCandidates'),
            event.candidate.toJSON()
          ).catch(e => console.warn('[WebRTC] Viewer ICE candidate write error:', e));
        }
      };

      // Set Remote Description from Offer
      if (pc.signalingState === 'stable') {
        isRemoteDescriptionSetRef.current = true;
        await pc.setRemoteDescription(new RTCSessionDescription(activeStream.offer));
        await flushIceCandidateQueue(pc);
      }

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

      // Listen for remote offer candidates with queue protection
      unsubCandidatesRef.current = onSnapshot(
        collection(firestoreDB, 'streams', 'activeStream', 'offerCandidates'),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              handleIncomingCandidate(change.doc.data());
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
  }, [activeStream, teardown, handleIncomingCandidate, flushIceCandidateQueue]);

  // Viewer leaves stream
  const leaveStream = useCallback(() => {
    teardown();
  }, [teardown]);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (isMicOn) {
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

      if (isStreamingRef.current) {
        updateDoc(doc(firestoreDB, 'streams', 'activeStream'), { micEnabled: false }).catch(() => {});
      }
    } else {
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

        if (isStreamingRef.current) {
          updateDoc(doc(firestoreDB, 'streams', 'activeStream'), { micEnabled: true }).catch(() => {});
        }
      } catch (err) {
        console.warn('[WebRTC] Microphone access denied:', err);
        setError('Microphone access denied.');
      }
    }
  }, [isMicOn]);

  // Attach active MediaStream directly to a <video> element
  const attachVideoStream = useCallback((videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;
    const stream = isStreamingRef.current ? localStreamRef.current : remoteStreamRef.current;
    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream || null;
    }
  }, []);

  const getActiveMediaStream = useCallback((): MediaStream | null => {
    return isStreamingRef.current ? localStreamRef.current : remoteStreamRef.current;
  }, []);

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
    streamTick,
    attachVideoStream,
    getActiveMediaStream,
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
