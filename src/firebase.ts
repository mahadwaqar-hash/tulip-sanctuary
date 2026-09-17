import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

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

// Generic hook to subscribe to a collection
export function useFirestore<T>(collectionName: string, orderField: string = 'createdAt', desc: boolean = false) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const q = query(collection(firestoreDB, collectionName), orderBy(orderField, desc ? 'desc' : 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(items);
    });

    return () => unsubscribe();
  }, [collectionName, orderField, desc]);

  return data;
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
    set: async (user: string, data: any) => await setDoc(doc(firestoreDB, 'userSettings', user), data, { merge: true }),
  }
};
