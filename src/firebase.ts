import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, setDoc, getDoc, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useState, useEffect, useRef, useCallback } from 'react';

const firebaseConfig = {
  apiKey: "AIzaSyCplL39Q5XixraueBrp6foest9JKSAndo4",
  authDomain: "tulip-sanctuary.firebaseapp.com",
  projectId: "tulip-sanctuary",
  storageBucket: "tulip-sanctuary.firebasestorage.app",
  messagingSenderId: "158715740736",
  appId: "1:158715740736:web:e27e498dc1df0b936155a5",
  measurementId: "G-W2DTPWXB4M"
};

const app = initializeApp(firebaseConfig);
export const firestoreDB = getFirestore(app);
export const storage = getStorage(app);

// Generic hook to subscribe to a collection
export function useFirestore<T>(collectionName: string, orderField: string = 'createdAt', desc: boolean = false) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const colRef = collection(firestoreDB, collectionName);
    const q = (orderField && orderField !== 'none' && orderField !== 'id' && collectionName !== 'userSettings' && collectionName !== 'presence')
      ? query(colRef, orderBy(orderField, desc ? 'desc' : 'asc'))
      : colRef;

    const unsubscribe = onSnapshot(q as any, (snapshot: any) => {
      const items: T[] = [];
      snapshot.forEach((doc: any) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(items);
    });

    return () => unsubscribe();
  }, [collectionName, orderField, desc]);

  return data;
}

// Optimized Chat Fetching Hook
export function useChatMessages(limitCount = 30) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  useEffect(() => {
    // Initial fetch for the latest messages
    const q = query(
      collection(firestoreDB, 'messages'), 
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // We fetch desc so newest is first. We reverse to render oldest at top.
      setMessages(newMessages.reverse());
      
      if (snapshot.docs.length < limitCount) {
        setHasMore(false);
      }
    });

    return () => unsubscribe();
  }, [limitCount]);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocRef.current) return;
    setLoadingMore(true);

    const q = query(
      collection(firestoreDB, 'messages'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDocRef.current),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      const olderMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      
      setMessages(prev => [...olderMessages, ...prev]);
    }

    if (snapshot.docs.length < limitCount) {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, limitCount]);

  return { messages, fetchMore, loadingMore, hasMore };
}

// Wrapper to mimic Dexie's API for easy migration
export const fb = {
  messages: {
    add: async (data: any) => await setDoc(doc(firestoreDB, 'messages', data.id), data),
    update: async (id: string, data: any) => await updateDoc(doc(firestoreDB, 'messages', id), data),
    delete: async (id: string) => await deleteDoc(doc(firestoreDB, 'messages', id)),
    get: async (id: string) => {
      const snap = await getDoc(doc(firestoreDB, 'messages', id));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    }
  },
  stickers: {
    add: async (data: any) => await setDoc(doc(firestoreDB, 'stickers', data.id), data),
    delete: async (id: string) => await deleteDoc(doc(firestoreDB, 'stickers', id)),
  },
  calendarEvents: {
    add: async (data: any) => await setDoc(doc(firestoreDB, 'calendarEvents', data.id), data),
    delete: async (id: string) => await deleteDoc(doc(firestoreDB, 'calendarEvents', id)),
  },
  vaultPhotos: {
    add: async (data: any) => await setDoc(doc(firestoreDB, 'vaultPhotos', data.id), data),
    delete: async (id: string) => await deleteDoc(doc(firestoreDB, 'vaultPhotos', id)),
  },
  scratchpad: {
    add: async (data: any) => await setDoc(doc(firestoreDB, 'scratchpad', data.id), data),
    update: async (id: string, data: any) => await updateDoc(doc(firestoreDB, 'scratchpad', id), data),
  },
  ldrLetters: {
    add: async (data: any) => await setDoc(doc(firestoreDB, 'ldrLetters', data.id), data),
    update: async (id: string, data: any) => await updateDoc(doc(firestoreDB, 'ldrLetters', id), data),
  },
  lovePings: {
    add: async (data: any) => await setDoc(doc(firestoreDB, 'lovePings', data.id), data),
    delete: async (id: string) => await deleteDoc(doc(firestoreDB, 'lovePings', id)),
  },
  typing: {
    set: async (user: string, isTyping: boolean) => {
      await setDoc(doc(firestoreDB, 'typing', user), { isTyping, updatedAt: Date.now() });
    }
  },
  userSettings: {
    set: async (user: string, data: any) => await setDoc(doc(firestoreDB, 'userSettings', user), { id: user, ...data }, { merge: true }),
  },
  presence: {
    set: async (user: string, data: any) => {
      try {
        await setDoc(doc(firestoreDB, 'presence', user), { id: user, ...data }, { merge: true });
      } catch (err) {
        console.error('Failed to update presence:', err);
      }
    }
  }
};
