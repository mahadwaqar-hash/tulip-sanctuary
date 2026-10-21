import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Heart, 
  Mail, 
  Clock, 
  Sparkles, 
  Moon, 
  Plus, 
  X,
  Send,
  MapPin,
  Edit3,
  Lock,
  Unlock,
  Trash2,
  Calendar,
  Gift
} from 'lucide-react';
import { useFirestore, fb } from '../firebase';
import type { LdrLetter } from '../db';
import type { LoveBurstType } from './FullScreenLoveBurst';
import { resolveTimezone, formatTimeInZone, POPULAR_CITIES, MAJOR_TIMEZONES, isValidTimezone, getAllTimezones, getNetworkDate, getNetworkNow } from '../utils/timezone';

const springConfig: Transition = { type: 'spring', stiffness: 400, damping: 26 };

interface LdrSanctuaryViewProps {
  currentUser: 'Mahad' | 'Ifa';
  onTriggerBurst: (type: LoveBurstType, sender: 'Mahad' | 'Ifa') => void;
}

export function getTodayInTimezone(tz: string = 'Asia/Karachi'): string {
  try {
    const d = getNetworkDate();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: isValidTimezone(tz) ? tz : 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

export function formatDateNice(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

export function calculateCountdown(targetDateStr?: string) {
  if (!targetDateStr) return { days: 0, hours: 0, minutes: 0, seconds: 0, isReached: false };
  try {
    const target = new Date(`${targetDateStr}T00:00:00`).getTime();
    const now = getNetworkNow();
    const diff = target - now;
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isReached: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, isReached: false };
  } catch (e) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isReached: false };
  }
}

const ALL_TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (e) {
    return ['Asia/Karachi', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai', 'Australia/Sydney'];
  }
})();

const DEFAULT_LETTERS: Array<{ title: string; content: string; sender: 'Mahad' | 'Ifa'; recipient: 'Mahad' | 'Ifa' }> = [
  {
    title: 'Open when you miss me at night 🌙',
    content: `My dearest,\n\nLook at the moon outside your window. Even though there are miles between us, we are looking at the exact same sky.\n\nEvery single day that passes is one day closer to the day I get to hold your hands and never let go. Close your eyes, I am hugging you right now. Sweet dreams, my love.\n\nAlways yours,\nMahad & Ifa`,
    sender: 'Mahad',
    recipient: 'Ifa'
  },
  {
    title: 'Open when you had an exhausting day 🧸',
    content: `Take a deep breath and let your shoulders drop.\n\nYou worked so hard today, and I am so immensely proud of you. Put your phone down, relax, and remember that you have someone in this world who loves you unconditionally and believes in you with their whole heart.\n\nRest well, sweetheart.`,
    sender: 'Ifa',
    recipient: 'Mahad'
  },
  {
    title: 'Open when you need a reminder of how much I love you 💕',
    content: `If distance has taught me anything, it is that love isn't measured in distance—it's measured in how effortlessly someone occupies your mind every waking second.\n\nI love your voice, your laugh, the way you say my name, and the warmth you bring into my life. You are my home, wherever you are.`,
    sender: 'Mahad',
    recipient: 'Ifa'
  },
  {
    title: 'Open the day before we see each other ✨',
    content: `Tomorrow is the day.\n\nNo more looking at photos wishing you were right next to me. Tomorrow, I get to hold your hand and hear your voice in person.\n\nTry to sleep early, tomorrow our fairytale continues! 🌹`,
    sender: 'Ifa',
    recipient: 'Mahad'
  }
];

function WorldClock({ timezone, city, label, icon: Icon }: { timezone: string; city: string; label: string; icon: any }) {
  const [time, setTime] = useState(getNetworkDate());

  useEffect(() => {
    const handleSync = () => setTime(getNetworkDate());
    window.addEventListener('aim:timesync', handleSync);
    const timer = setInterval(() => setTime(getNetworkDate()), 1000);
    return () => {
      window.removeEventListener('aim:timesync', handleSync);
      clearInterval(timer);
    };
  }, []);

  const safeTz = resolveTimezone(city, timezone, 'Asia/Karachi');
  const { formattedTime, isDaytime } = formatTimeInZone(time, safeTz);

  return (
    <div className={`p-5 rounded-[1.5rem] glass-panel border border-border flex flex-col justify-between overflow-hidden relative shadow-sm ${
      isDaytime 
        ? 'bg-gradient-to-br from-amber-500/20 to-surface/40' 
        : 'bg-gradient-to-br from-indigo-900/40 to-surface/40'
    }`}>
      <div className="absolute -right-4 -top-4 opacity-20 pointer-events-none">
        {isDaytime ? <Sparkles className="w-24 h-24 text-amber-300" /> : <Moon className="w-24 h-24 text-indigo-300" />}
      </div>
      
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400">
          {label}
        </span>
        <Icon className="w-4 h-4 text-text-muted" />
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-bold font-sans text-text-main tracking-tight">
          {formattedTime}
        </h3>
        <p className="text-[11px] text-text-muted mt-1 font-medium flex items-center gap-1 leading-none truncate">
          <MapPin className="w-3 h-3 text-pastel-pink-400 shrink-0" /> {city}
        </p>
      </div>
    </div>
  );
}

export default function LdrSanctuaryView({ currentUser, onTriggerBurst }: LdrSanctuaryViewProps) {
  const settingsArray = useFirestore<any>('userSettings', 'id', false);
  const globalSettings = settingsArray.find(s => s.id === 'global') || {};
  
  // Reunion target date
  const reunionDateStr = globalSettings.reunionDate || localStorage.getItem('tulip_reunion_date') || '2026-10-25';
  const [isEditingReunion, setIsEditingReunion] = useState(false);

  const [, setCitySyncTick] = useState(0);
  useEffect(() => {
    const handleSync = () => setCitySyncTick(t => t + 1);
    window.addEventListener('aim:citysync', handleSync);
    return () => window.removeEventListener('aim:citysync', handleSync);
  }, []);

  const mahadSettings = settingsArray.find(s => s.id === 'Mahad') || {};
  const ifaSettings = settingsArray.find(s => s.id === 'Ifa') || {};

  const mahadCityStr = mahadSettings.city || globalSettings.mahadCity || localStorage.getItem('tulip_mahad_city') || 'Lahore, PK';
  const mahadTzStr = mahadSettings.tz || globalSettings.mahadTz || localStorage.getItem('tulip_mahad_tz') || resolveTimezone(mahadCityStr, undefined, 'Asia/Karachi');

  const ifaCityStr = ifaSettings.city || globalSettings.ifaCity || localStorage.getItem('tulip_ifa_city') || 'Gujranwala, PK';
  const ifaTzStr = ifaSettings.tz || globalSettings.ifaTz || localStorage.getItem('tulip_ifa_tz') || resolveTimezone(ifaCityStr, undefined, 'Asia/Karachi');

  // Custom Cities & Timezones State (for editing)
  const [mahadCity, setMahadCity] = useState(mahadCityStr);
  const [mahadTz, setMahadTz] = useState(mahadTzStr);
  const [ifaCity, setIfaCity] = useState(ifaCityStr);
  const [ifaTz, setIfaTz] = useState(ifaTzStr);
  const [isEditingCities, setIsEditingCities] = useState(false);

  useEffect(() => {
    if (mahadCityStr) localStorage.setItem('tulip_mahad_city', mahadCityStr);
    if (mahadTzStr) localStorage.setItem('tulip_mahad_tz', mahadTzStr);
    if (ifaCityStr) localStorage.setItem('tulip_ifa_city', ifaCityStr);
    if (ifaTzStr) localStorage.setItem('tulip_ifa_tz', ifaTzStr);
  }, [mahadCityStr, mahadTzStr, ifaCityStr, ifaTzStr]);

  useEffect(() => {
    if (!isEditingCities) {
      setMahadCity(mahadCityStr);
      setMahadTz(mahadTzStr);
      setIfaCity(ifaCityStr);
      setIfaTz(ifaTzStr);
    }
  }, [mahadCityStr, mahadTzStr, ifaCityStr, ifaTzStr, isEditingCities]);

  // Letter Reader & Writer & Birthday Lock
  const [selectedLetter, setSelectedLetter] = useState<LdrLetter | null>(null);
  const [lockedBirthdayLetter, setLockedBirthdayLetter] = useState<LdrLetter | null>(null);
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [isDateLocked, setIsDateLocked] = useState(false);
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterContent, setNewLetterContent] = useState('');
  const [newLetterUnlockDate, setNewLetterUnlockDate] = useState(() => {
    return globalSettings.ifaBirthday || localStorage.getItem('tulip_ifa_birthday') || '';
  });
  const [showBirthdayConfetti, setShowBirthdayConfetti] = useState(false);

  const letters = useFirestore<LdrLetter>('ldrLetters', 'createdAt', true);

  // Live countdown for locked birthday letter modal
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isReached: false });
  useEffect(() => {
    if (!lockedBirthdayLetter?.unlockDate) return;
    const updateCountdown = () => {
      setCountdown(calculateCountdown(lockedBirthdayLetter.unlockDate));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedBirthdayLetter]);

  // Check if a letter is currently locked for a user
  const isLetterLocked = (letter: LdrLetter) => {
    if (!letter.unlockDate) return false;
    // Author can always preview their own letter
    if (currentUser === letter.sender) return false;
    // Once unsealed, it can always be re-read
    if (letter.isOpened) return false;

    const recipientTz = letter.recipient === 'Ifa' ? ifaTzStr : mahadTzStr;
    const todayInTz = getTodayInTimezone(recipientTz);
    return todayInTz < letter.unlockDate;
  };

  // Seed default letters if empty
  useEffect(() => {
    const seed = async () => {
      // With firestore, we don't seed if it's already seeded by the other person.
      // But we can check if letters is empty. We will skip seeding for firestore for now
      // to avoid double-seeding.
    };
    seed();
  }, []);

  const calculateDaysLeft = () => {
    const target = new Date(reunionDateStr + 'T00:00:00').getTime();
    const now = getNetworkNow();
    const diff = target - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleSendLoveBurst = async (type: LoveBurstType) => {
    if ('vibrate' in navigator) navigator.vibrate([60, 40, 60]);

    try {
      // Save to Firebase
      await fb.lovePings.add({
        id: crypto.randomUUID(),
        sender: currentUser,
        recipient: currentUser === 'Mahad' ? 'Ifa' : 'Mahad',
        type,
        createdAt: Date.now()
      });

      // Immediately trigger full-screen fairytale animation!
      onTriggerBurst(type, currentUser);
    } catch (error) {
      console.error('Failed to send love burst:', error);
      alert('Could not send love burst. Please check your connection.');
    }
  };

  const handleOpenLetter = async (letter: LdrLetter) => {
    // If it's locked for the recipient, open the locked countdown modal
    if (isLetterLocked(letter)) {
      setLockedBirthdayLetter(letter);
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);
      return;
    }

    // If it's the author previewing their own locked letter before the date
    if (currentUser === letter.sender && letter.unlockDate) {
      const recipientTz = letter.recipient === 'Ifa' ? ifaTzStr : mahadTzStr;
      const todayInTz = getTodayInTimezone(recipientTz);
      if (todayInTz < letter.unlockDate) {
        setSelectedLetter(letter);
        return; // Don't mark isOpened: true when author is previewing!
      }
    }

    // Recipient unsealing on/after unlock date
    if (!letter.isOpened) {
      await fb.ldrLetters.update(letter.id, {
        isOpened: true,
        openedAt: Date.now()
      });
      if (letter.isBirthday) {
        setShowBirthdayConfetti(true);
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
        setTimeout(() => setShowBirthdayConfetti(false), 7000);
      }
    }

    setSelectedLetter(letter);
    if ('vibrate' in navigator) navigator.vibrate([40, 50]);
  };

  const handleOpenWriteModal = () => {
    setEditingLetterId(null);
    setIsDateLocked(false);
    setNewLetterTitle('');
    const savedBday = globalSettings.ifaBirthday || localStorage.getItem('tulip_ifa_birthday') || '';
    setNewLetterUnlockDate(savedBday);
    setNewLetterContent('');
    setShowWriteModal(true);
  };

  const handleStartEditLetter = (letter: LdrLetter) => {
    setSelectedLetter(null);
    setEditingLetterId(letter.id);
    setIsDateLocked(Boolean(letter.unlockDate));
    setNewLetterTitle(letter.title);
    setNewLetterContent(letter.content);
    setNewLetterUnlockDate(letter.unlockDate || '');
    setShowWriteModal(true);
  };

  const handleDeleteLetter = async (letterId: string) => {
    if (window.confirm('Are you sure you want to delete this sealed letter?')) {
      await fb.ldrLetters.delete(letterId);
      setSelectedLetter(null);
      if ('vibrate' in navigator) navigator.vibrate(50);
    }
  };

  const handleSaveNewLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLetterTitle.trim() || !newLetterContent.trim()) return;

    const unlockDate = isDateLocked ? (newLetterUnlockDate.trim() || null) : null;

    if (isDateLocked && !unlockDate) {
      alert("Please select the date so the letter knows when to unlock!");
      return;
    }

    if ('vibrate' in navigator) navigator.vibrate(50);

    if (isDateLocked && unlockDate) {
      localStorage.setItem('tulip_ifa_birthday', unlockDate);
      await fb.userSettings.set('global', { ifaBirthday: unlockDate });
    }

    if (editingLetterId) {
      await fb.ldrLetters.update(editingLetterId, {
        title: newLetterTitle.trim(),
        content: newLetterContent.trim(),
        unlockDate: unlockDate || null,
        isBirthday: Boolean(unlockDate)
      });
    } else {
      await fb.ldrLetters.add({
        id: crypto.randomUUID(),
        title: newLetterTitle.trim(),
        content: newLetterContent.trim(),
        sender: currentUser,
        recipient: currentUser === 'Mahad' ? 'Ifa' : 'Mahad',
        isOpened: false,
        isBirthday: Boolean(unlockDate),
        unlockDate: unlockDate || null,
        createdAt: Date.now()
      });
    }

    setEditingLetterId(null);
    setNewLetterTitle('');
    setNewLetterContent('');
    setIsDateLocked(false);
    setShowWriteModal(false);
  };

  const handleSaveCities = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMahadCity = mahadCity.trim() || 'Lahore, PK';
    const cleanIfaCity = ifaCity.trim() || 'Gujranwala, PK';
    const cleanMahadTz = isValidTimezone(mahadTz) ? mahadTz : resolveTimezone(cleanMahadCity, undefined, 'Asia/Karachi');
    const cleanIfaTz = isValidTimezone(ifaTz) ? ifaTz : resolveTimezone(cleanIfaCity, undefined, 'Asia/Karachi');

    localStorage.setItem('tulip_mahad_city', cleanMahadCity);
    localStorage.setItem('tulip_ifa_city', cleanIfaCity);
    localStorage.setItem('tulip_mahad_tz', cleanMahadTz);
    localStorage.setItem('tulip_ifa_tz', cleanIfaTz);
    
    // Save to Firebase for live sync
    await fb.userSettings.set('Mahad', { id: 'Mahad', city: cleanMahadCity, tz: cleanMahadTz });
    await fb.userSettings.set('Ifa', { id: 'Ifa', city: cleanIfaCity, tz: cleanIfaTz });
    await fb.userSettings.set('global', {
      mahadCity: cleanMahadCity,
      mahadTz: cleanMahadTz,
      ifaCity: cleanIfaCity,
      ifaTz: cleanIfaTz
    });
    
    window.dispatchEvent(new Event('aim:citysync'));
    setIsEditingCities(false);
  };

  const daysUntilReunion = calculateDaysLeft();

  return (
    <div className="flex-1 flex flex-col h-full md:rounded-[2.5rem] md:glass-panel shadow-2xl overflow-hidden md:border border-border relative">
      
      {/* HEADER */}
      <div className="px-8 py-5 border-b border-border bg-surface/80 backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-pastel-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
              <span>LDR Sanctuary Bridge</span>
              <Sparkles className="w-4 h-4 text-pastel-pink-400" />
            </h2>
            <p className="text-xs text-text-muted font-medium">
              Bridging our distance with love until we are together again.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEditingCities(true)}
            className="px-4 py-2 rounded-full border border-border bg-surface-hover text-xs font-bold text-text-main hover:border-pastel-pink-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-pastel-pink-400" /> Set Our Cities
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenWriteModal}
            className="px-5 py-2 rounded-full bg-pastel-pink-400 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Seal A Letter
          </motion.button>
        </div>
      </div>

      {/* MAIN LDR CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6">
        
        {/* ROW 1: DUAL TIME & REUNION COUNTDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Mahad's Time Card */}
          <WorldClock 
            timezone={mahadTz} 
            city={mahadCity} 
            label="Mahad's Clock 🌹" 
            icon={Clock} 
          />

          {/* Reunion Countdown Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-pastel-pink-400 to-pastel-pink-300 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                Next Time We See Each Other 💕
              </span>
              <button
                onClick={() => setIsEditingReunion(!isEditingReunion)}
                className="text-xs text-white/90 hover:text-white underline cursor-pointer"
              >
                {isEditingReunion ? 'Done' : 'Change Date'}
              </button>
            </div>

            {isEditingReunion ? (
              <input
                type="date"
                defaultValue={reunionDateStr}
                onChange={async (e) => {
                  localStorage.setItem('tulip_reunion_date', e.target.value);
                  await fb.userSettings.set('global', { reunionDate: e.target.value });
                }}
                className="my-3 p-2 rounded-xl bg-white/20 text-white border border-white/40 text-sm outline-none font-bold"
              />
            ) : (
              <div className="my-2">
                <h3 className="text-4xl font-bold font-sans tabular-nums tracking-tight">
                  {daysUntilReunion} <span className="text-lg font-sans font-medium">Days</span>
                </h3>
                <p className="text-xs text-white/90 mt-1 font-medium">
                  {daysUntilReunion === 0
                    ? 'Today is the day we hug! 💕'
                    : `Until we are wrapped in each other's arms`}
                </p>
              </div>
            )}

            <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">
              Target: {new Date(reunionDateStr + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Ifa's Time Card */}
          <WorldClock 
            timezone={ifaTz} 
            city={ifaCity} 
            label="Ifa's Clock 🌷" 
            icon={Moon} 
          />

        </div>

        {/* ROW 2: FULL SCREEN LOVE BURSTS (KISSES & HUGS) */}
        <div className="p-6 rounded-3xl glass-panel border border-border shadow-md flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-base text-text-main flex items-center gap-2">
              <span>Send Full-Screen Fairytale Bursts</span>
              <Sparkles className="w-4 h-4 text-pastel-pink-400" />
            </h3>
            <p className="text-xs text-text-muted">
              Tap any button to unleash a vintage fairytale full-screen animation across the entire sanctuary!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSendLoveBurst('kiss')}
              className="p-4 rounded-2xl bg-surface-hover border border-border hover:border-rose-400 flex items-center gap-3 transition-all cursor-pointer shadow-xs group"
            >
              <span className="text-3xl group-hover:scale-120 transition-transform">💋</span>
              <div className="text-left">
                <span className="font-bold text-xs text-text-main block">Giant Kiss</span>
                <span className="text-[10px] text-pastel-pink-400 font-semibold">Kiss Burst Animation</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSendLoveBurst('hug')}
              className="p-4 rounded-2xl bg-surface-hover border border-border hover:border-amber-400 flex items-center gap-3 transition-all cursor-pointer shadow-xs group"
            >
              <span className="text-3xl group-hover:scale-120 transition-transform">🫂</span>
              <div className="text-left">
                <span className="font-bold text-xs text-text-main block">Warm Hug</span>
                <span className="text-[10px] text-amber-500 font-semibold">Wrapping Arms Animation</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSendLoveBurst('thinking')}
              className="p-4 rounded-2xl bg-surface-hover border border-border hover:border-purple-400 flex items-center gap-3 transition-all cursor-pointer shadow-xs group"
            >
              <span className="text-3xl group-hover:scale-120 transition-transform">💭</span>
              <div className="text-left">
                <span className="font-bold text-xs text-text-main block">Thinking of You</span>
                <span className="text-[10px] text-purple-400 font-semibold">Love Thoughts Burst</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSendLoveBurst('stars')}
              className="p-4 rounded-2xl bg-surface-hover border border-border hover:border-yellow-400 flex items-center gap-3 transition-all cursor-pointer shadow-xs group"
            >
              <span className="text-3xl group-hover:scale-120 transition-transform">✨</span>
              <div className="text-left">
                <span className="font-bold text-xs text-text-main block">Fairytale Stars</span>
                <span className="text-[10px] text-yellow-500 font-semibold">Golden Starfall</span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* ROW 3: "OPEN WHEN..." & SEALED ENVELOPES */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
                <span>"Open When..." & Sealed Letters</span>
                <Mail className="w-4 h-4 text-pastel-pink-400" />
              </h3>
              <p className="text-xs text-text-muted font-medium">
                Wax-sealed romantic envelopes and special date-locked surprises.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {letters.map((letter) => {
              const recipientTz = letter.recipient === 'Ifa' ? ifaTzStr : mahadTzStr;
              const todayInTz = getTodayInTimezone(recipientTz);
              const isLockedForMe = isLetterLocked(letter);
              const isAuthor = currentUser === letter.sender;
              const isTimed = Boolean(letter.unlockDate);
              const isReadyToday = isTimed && todayInTz >= (letter.unlockDate || '') && !letter.isOpened;

              return (
                <motion.div
                  key={letter.id}
                  whileHover={{ scale: 1.03, y: -3 }}
                  onClick={() => handleOpenLetter(letter)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between min-h-[185px] relative shadow-md will-change-transform ${
                    letter.isOpened
                      ? 'bg-surface-hover/70 border-border'
                      : isReadyToday
                        ? 'bg-gradient-to-br from-amber-50 via-white to-pastel-pink-50 dark:from-surface dark:via-surface dark:to-rose-950/20 border-2 border-pastel-pink-400 shadow-xl'
                        : 'bg-gradient-to-br from-white via-pastel-pink-50 to-pastel-pink-100/50 dark:from-surface dark:via-surface dark:to-pastel-pink-950/20 border-pastel-pink-300 dark:border-pastel-pink-400/40 shadow-pastel-pink-100/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400">
                        From {letter.sender}
                      </span>
                      <span className="text-xs">
                        {letter.isOpened ? (
                          '💌 Unsealed'
                        ) : isLockedForMe ? (
                          '🔒 Wax-Sealed'
                        ) : isReadyToday ? (
                          '🎉 Ready Today'
                        ) : (
                          '🔒 Wax-Sealed'
                        )}
                      </span>
                    </div>

                    <h4 className="font-bold text-base font-serif-italic text-text-main line-clamp-2 leading-snug">
                      {letter.title}
                    </h4>

                    {letter.unlockDate && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pastel-pink-500/10 text-pastel-pink-600 dark:text-pastel-pink-400 border border-pastel-pink-300/30">
                        <span>🔒 Date:</span>
                        <span>{formatDateNice(letter.unlockDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-text-muted">
                    {letter.isOpened ? (
                      <span className="flex items-center gap-1">Click to re-read 💕</span>
                    ) : isLockedForMe ? (
                      <span className="text-pastel-pink-500 dark:text-pastel-pink-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked until {formatDateNice(letter.unlockDate)}
                      </span>
                    ) : isAuthor && isTimed && todayInTz < (letter.unlockDate || '') ? (
                      <span className="text-text-muted flex items-center gap-1">
                        <Lock className="w-3 h-3 text-pastel-pink-400" /> Locked for {letter.recipient} (Edit)
                      </span>
                    ) : isReadyToday ? (
                      <span className="text-pastel-pink-500 dark:text-pastel-pink-400 font-bold flex items-center gap-1">
                        <span>Tap to break seal 🎉</span>
                      </span>
                    ) : (
                      <span>Tap to break seal 💕</span>
                    )}
                    <Heart className="w-3.5 h-3.5 text-pastel-pink-400 fill-pastel-pink-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      {/* EDIT CITIES MODAL */}
      <AnimatePresence>
        {isEditingCities && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full rounded-[2.5rem] p-8 glass-panel border border-border shadow-2xl flex flex-col bg-surface"
            >
              <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-1">Set Your Cities</h3>
              <p className="text-xs text-text-muted mb-6">
                Customize where Mahad and Ifa are located so the clocks and weather map properly!
              </p>

              <form onSubmit={handleSaveCities} className="flex flex-col gap-4">
                {/* Mahad's City & Timezone */}
                <div className="p-3.5 rounded-2xl bg-surface-hover/60 border border-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                      <span>🌹 Mahad's Location</span>
                    </label>
                    <span className="text-[11px] font-bold text-pastel-pink-400">
                      Live: {formatTimeInZone(getNetworkDate(), mahadTz).formattedTime}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={mahadCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMahadCity(val);
                      const detected = resolveTimezone(val, undefined, '');
                      if (detected && detected !== 'Asia/Karachi') {
                        setMahadTz(detected);
                      }
                    }}
                    placeholder="City Name (e.g. Lahore, PK)"
                    className="w-full bg-surface p-2.5 rounded-xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
                    required
                  />

                  {/* Quick Presets for Mahad */}
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {[
                      { city: 'Lahore, PK', tz: 'Asia/Karachi', label: 'Lahore' },
                      { city: 'Gujranwala, PK', tz: 'Asia/Karachi', label: 'Gujranwala' },
                      { city: 'Islamabad, PK', tz: 'Asia/Karachi', label: 'Islamabad' },
                      { city: 'Karachi, PK', tz: 'Asia/Karachi', label: 'Karachi' },
                      { city: 'Dubai, UAE', tz: 'Asia/Dubai', label: 'Dubai' },
                      { city: 'New York, US', tz: 'America/New_York', label: 'New York' }
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setMahadCity(p.city);
                          setMahadTz(p.tz);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer ${
                          mahadCity === p.city
                            ? 'bg-pastel-pink-400 text-white border-pastel-pink-400'
                            : 'bg-surface hover:border-pastel-pink-400 text-text-muted hover:text-text-main border-border'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Timezone Select */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      Selected Timezone
                    </span>
                    <select
                      value={mahadTz}
                      onChange={(e) => {
                        const newTz = e.target.value;
                        setMahadTz(newTz);
                        // Also auto-update city display label if user didn't write a custom one
                        const foundCity = POPULAR_CITIES.find(c => c.tz === newTz);
                        if (foundCity && (!mahadCity || mahadCity.includes('Lahore') || mahadCity.includes('Gujranwala'))) {
                          setMahadCity(foundCity.city);
                        }
                      }}
                      className="w-full bg-surface p-2 rounded-xl border border-border text-xs text-text-main outline-none focus:border-pastel-pink-400 font-medium cursor-pointer"
                    >
                      {MAJOR_TIMEZONES.map(m => (
                        <option key={m.tz} value={m.tz}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ifa's City & Timezone */}
                <div className="p-3.5 rounded-2xl bg-surface-hover/60 border border-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                      <span>🌷 Ifa's Location</span>
                    </label>
                    <span className="text-[11px] font-bold text-pastel-pink-400">
                      Live: {formatTimeInZone(getNetworkDate(), ifaTz).formattedTime}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={ifaCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIfaCity(val);
                      const detected = resolveTimezone(val, undefined, '');
                      if (detected && detected !== 'Asia/Karachi') {
                        setIfaTz(detected);
                      }
                    }}
                    placeholder="City Name (e.g. Gujranwala, PK)"
                    className="w-full bg-surface p-2.5 rounded-xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
                    required
                  />

                  {/* Quick Presets for Ifa */}
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {[
                      { city: 'Gujranwala, PK', tz: 'Asia/Karachi', label: 'Gujranwala' },
                      { city: 'Lahore, PK', tz: 'Asia/Karachi', label: 'Lahore' },
                      { city: 'Islamabad, PK', tz: 'Asia/Karachi', label: 'Islamabad' },
                      { city: 'Sialkot, PK', tz: 'Asia/Karachi', label: 'Sialkot' },
                      { city: 'Karachi, PK', tz: 'Asia/Karachi', label: 'Karachi' },
                      { city: 'Dubai, UAE', tz: 'Asia/Dubai', label: 'Dubai' }
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setIfaCity(p.city);
                          setIfaTz(p.tz);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer ${
                          ifaCity === p.city
                            ? 'bg-pastel-pink-400 text-white border-pastel-pink-400'
                            : 'bg-surface hover:border-pastel-pink-400 text-text-muted hover:text-text-main border-border'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Timezone Select */}
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      Selected Timezone
                    </span>
                    <select
                      value={ifaTz}
                      onChange={(e) => {
                        const newTz = e.target.value;
                        setIfaTz(newTz);
                        // Also auto-update city display label if user didn't write a custom one
                        const foundCity = POPULAR_CITIES.find(c => c.tz === newTz);
                        if (foundCity && (!ifaCity || ifaCity.includes('Gujranwala') || ifaCity.includes('Lahore'))) {
                          setIfaCity(foundCity.city);
                        }
                      }}
                      className="w-full bg-surface p-2 rounded-xl border border-border text-xs text-text-main outline-none focus:border-pastel-pink-400 font-medium cursor-pointer"
                    >
                      {MAJOR_TIMEZONES.map(m => (
                        <option key={m.tz} value={m.tz}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCities(false)}
                    className="px-5 py-2.5 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors cursor-pointer"
                  >
                    Save Locations ✨
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHHH! NO PEEKING - LOCKED BIRTHDAY LETTER MODAL (FOR RECIPIENT BEFORE BIRTHDAY) */}
      <AnimatePresence>
        {lockedBirthdayLetter && (
          <div
            onClick={() => setLockedBirthdayLetter(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={springConfig}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full rounded-[2.5rem] p-8 md:p-9 glass-panel border-2 border-amber-300/60 dark:border-amber-400/40 shadow-2xl flex flex-col items-center text-center bg-surface relative overflow-hidden"
            >
              {/* Floating gold ribbon ornament */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-300 via-rose-400 to-pastel-pink-400" />
              
              <button
                onClick={() => setLockedBirthdayLetter(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Shaking Lock Animation with Gift Box */}
              <div className="relative mb-3 mt-1">
                <motion.div
                  animate={{ 
                    rotate: [0, -5, 5, -3, 3, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 via-rose-400 to-pastel-pink-400 text-white flex items-center justify-center shadow-xl shadow-amber-300/30 text-3xl"
                >
                  🎁
                </motion.div>
                <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-surface border-2 border-amber-300 text-amber-500 shadow-md">
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              <span className="text-[11px] font-bold uppercase tracking-widest text-pastel-pink-400 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Enchanted Lock
              </span>

              <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-2">
                Shhh! No Peeking! 🤫
              </h3>

              <p className="text-xs text-text-muted mb-5 leading-relaxed font-medium">
                Mahad has sealed this letter with fairy magic. It will strictly open <strong className="text-pastel-pink-500 font-bold">only on {formatDateNice(lockedBirthdayLetter.unlockDate)}</strong>! No other day will unlock it.
              </p>

              {/* LIVE TICKING COUNTDOWN */}
              <div className="w-full p-4 rounded-2xl bg-surface-hover/80 border border-amber-300/40 mb-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                  Unlocks in
                </span>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-surface border border-border shadow-2xs">
                    <span className="text-lg font-bold font-sans text-text-main tabular-nums block">{countdown.days}</span>
                    <span className="text-[9px] uppercase font-bold text-text-muted">Days</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-border shadow-2xs">
                    <span className="text-lg font-bold font-sans text-text-main tabular-nums block">{countdown.hours}</span>
                    <span className="text-[9px] uppercase font-bold text-text-muted">Hours</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-border shadow-2xs">
                    <span className="text-lg font-bold font-sans text-text-main tabular-nums block">{countdown.minutes}</span>
                    <span className="text-[9px] uppercase font-bold text-text-muted">Mins</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface border border-border shadow-2xs">
                    <span className="text-lg font-bold font-sans text-text-main tabular-nums block">{countdown.seconds}</span>
                    <span className="text-[9px] uppercase font-bold text-text-muted">Secs</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-pastel-pink-400 font-fairytale lowercase -mt-2 mb-4">
                patience, pretty girl... true love is worth waiting for 💕
              </p>

              <button
                onClick={() => setLockedBirthdayLetter(null)}
                className="w-full py-3 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-all cursor-pointer"
              >
                I'll Be Patient! 🌸
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* READ / UNSEALED / AUTHOR PREVIEW LETTER MODAL */}
      <AnimatePresence>
        {selectedLetter && (
          <div
            onClick={() => setSelectedLetter(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={springConfig}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-lg w-full rounded-[2.5rem] p-8 md:p-10 glass-panel border shadow-2xl flex flex-col bg-surface relative overflow-hidden ${
                selectedLetter.isBirthday
                  ? 'border-2 border-amber-300 dark:border-amber-400/50 shadow-amber-200/40'
                  : 'border-border'
              }`}
            >
              {/* Golden gradient strip for birthday letters */}
              {selectedLetter.isBirthday && (
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-300 via-rose-400 to-pastel-pink-400" />
              )}

              <button
                onClick={() => setSelectedLetter(null)}
                className="absolute top-6 right-6 p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Author Preview Notice (if Mahad views his sent letter before her birthday) */}
              {currentUser === selectedLetter.sender && selectedLetter.unlockDate && (() => {
                const recipientTz = selectedLetter.recipient === 'Ifa' ? ifaTzStr : mahadTzStr;
                const today = getTodayInTimezone(recipientTz);
                const isStillLockedForHer = today < selectedLetter.unlockDate;
                if (isStillLockedForHer) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-pastel-pink-500/10 border border-pastel-pink-300/40 mb-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-pastel-pink-400 shrink-0" />
                        <div>
                          <span className="font-bold text-text-main block">
                            Author Preview • Sealed for {selectedLetter.recipient}
                          </span>
                          <span className="text-[11px] text-text-muted">
                            🔒 Strictly locked for {selectedLetter.recipient} until {formatDateNice(selectedLetter.unlockDate)}. She cannot see this yet!
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEditLetter(selectedLetter)}
                          className="px-2.5 py-1 rounded-full bg-pastel-pink-400 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-pastel-pink-300 transition-colors cursor-pointer"
                        >
                          Edit ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteLetter(selectedLetter.id)}
                          className="p-1 rounded-full text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete letter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pastel-pink-400 mb-2">
                <Mail className="w-4 h-4" />
                <span>Written with love by {selectedLetter.sender}</span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold font-serif-italic text-text-main mb-4 leading-tight">
                {selectedLetter.title}
              </h3>

              <div className="max-h-[50vh] overflow-y-auto pr-2 text-sm leading-relaxed text-text-main/90 font-medium whitespace-pre-wrap font-sans border-t border-b border-border/40 py-4 my-2">
                {selectedLetter.content}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                <span>
                  {selectedLetter.unlockDate
                    ? `Date: ${formatDateNice(selectedLetter.unlockDate)}`
                    : `For: ${selectedLetter.recipient}`}
                </span>
                <div className="flex items-center gap-2">
                  {currentUser === selectedLetter.sender && (
                    <button
                      onClick={() => handleStartEditLetter(selectedLetter)}
                      className="px-3 py-1.5 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold transition-colors cursor-pointer"
                    >
                      Edit ✏️
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedLetter(null)}
                    className="px-5 py-2 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-pastel-pink-300 transition-colors"
                  >
                    Keep in Heart 💕
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WRITE / EDIT SEALED LETTER MODAL */}
      <AnimatePresence>
        {showWriteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={springConfig}
              className="max-w-lg w-full rounded-[2.5rem] p-8 glass-panel border border-border shadow-2xl flex flex-col bg-surface"
            >
              <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-1">
                {editingLetterId ? 'Edit Sealed Letter' : 'Seal A Romantic Letter'}
              </h3>
              <p className="text-xs text-text-muted mb-4 font-medium">
                Write an emotional letter for your soulmate.
              </p>

              <form onSubmit={handleSaveNewLetter} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Envelope Label (e.g. Open when you miss me, Open on your birthday...)"
                  value={newLetterTitle}
                  onChange={(e) => setNewLetterTitle(e.target.value)}
                  className="bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400"
                  required
                  autoFocus
                />
                <textarea
                  placeholder="Pour your heart out here. This envelope will stay sealed until opened..."
                  value={newLetterContent}
                  onChange={(e) => setNewLetterContent(e.target.value)}
                  rows={6}
                  className="bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400 resize-none leading-relaxed font-sans"
                  required
                />

                {/* Optional Date Lock Setting */}
                <div className="p-3.5 rounded-2xl bg-surface-hover/70 border border-border flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDateLocked}
                      onChange={(e) => setIsDateLocked(e.target.checked)}
                      className="w-4 h-4 rounded text-pastel-pink-400 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-pastel-pink-400" />
                      <span>Lock until a specific date (optional)</span>
                    </span>
                  </label>

                  {isDateLocked && (
                    <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        Unlock Date
                      </label>
                      <input
                        type="date"
                        value={newLetterUnlockDate}
                        onChange={(e) => setNewLetterUnlockDate(e.target.value)}
                        className="bg-surface p-2.5 rounded-xl border border-border text-text-main outline-none text-xs font-bold focus:border-pastel-pink-400"
                        required={isDateLocked}
                      />
                      <span className="text-[10px] text-text-muted">
                        🔒 Strictly locked for the recipient until this date.
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWriteModal(false);
                      setEditingLetterId(null);
                    }}
                    className="px-5 py-2.5 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-6 py-2.5 rounded-full text-white font-bold text-xs uppercase tracking-wider shadow-md bg-pastel-pink-400 hover:bg-pastel-pink-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{editingLetterId ? 'Update Letter 💾' : 'Seal Envelope 💌'}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING BIRTHDAY CONFETTI CELEBRATION OVERLAY */}
      <AnimatePresence>
        {showBirthdayConfetti && (
          <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden select-none">
            {Array.from({ length: 48 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 1,
                  y: -50,
                  x: (Math.random() - 0.5) * (typeof window !== 'undefined' ? window.innerWidth : 800) + (typeof window !== 'undefined' ? window.innerWidth / 2 : 400),
                  scale: 0.5 + Math.random() * 0.8,
                  rotate: 0
                }}
                animate={{
                  opacity: [1, 1, 0.9, 0],
                  y: (typeof window !== 'undefined' ? window.innerHeight : 900) + 100,
                  rotate: (Math.random() - 0.5) * 800
                }}
                transition={{
                  duration: 3.5 + Math.random() * 2,
                  ease: 'easeOut',
                  delay: Math.random() * 0.6
                }}
                className="absolute text-2xl pointer-events-none drop-shadow-md"
              >
                {['🎉', '🎂', '✨', '💖', '🌸', '🎈', '🍰', '🎁'][i % 8]}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
