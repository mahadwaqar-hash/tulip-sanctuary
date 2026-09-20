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
  Edit3
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

const ALL_TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (e) {
    return ['Europe/London', 'Asia/Karachi', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai', 'Australia/Sydney'];
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

  const safeTz = resolveTimezone(city, timezone, label.includes('Mahad') ? 'Asia/Karachi' : 'Europe/London');
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

  const ifaCityStr = ifaSettings.city || globalSettings.ifaCity || localStorage.getItem('tulip_ifa_city') || 'London, UK';
  const ifaTzStr = ifaSettings.tz || globalSettings.ifaTz || localStorage.getItem('tulip_ifa_tz') || resolveTimezone(ifaCityStr, undefined, 'Europe/London');

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

  // Letter Reader & Writer
  const [selectedLetter, setSelectedLetter] = useState<LdrLetter | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newLetterTitle, setNewLetterTitle] = useState('');
  const [newLetterContent, setNewLetterContent] = useState('');

  const letters = useFirestore<LdrLetter>('ldrLetters', 'createdAt', true);

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
    if (!letter.isOpened) {
      await fb.ldrLetters.update(letter.id, {
        isOpened: true,
        openedAt: Date.now()
      });
    }
    setSelectedLetter(letter);
    if ('vibrate' in navigator) navigator.vibrate([40, 50]);
  };

  const handleSaveNewLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLetterTitle.trim() || !newLetterContent.trim()) return;

    if ('vibrate' in navigator) navigator.vibrate(50);

    await fb.ldrLetters.add({
      id: crypto.randomUUID(),
      title: newLetterTitle.trim(),
      content: newLetterContent.trim(),
      sender: currentUser,
      recipient: currentUser === 'Mahad' ? 'Ifa' : 'Mahad',
      isOpened: false,
      createdAt: Date.now()
    });

    setNewLetterTitle('');
    setNewLetterContent('');
    setShowWriteModal(false);
  };

  const handleSaveCities = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMahadCity = mahadCity.trim() || 'Lahore, PK';
    const cleanIfaCity = ifaCity.trim() || 'London, UK';
    const cleanMahadTz = isValidTimezone(mahadTz) ? mahadTz : resolveTimezone(cleanMahadCity, undefined, 'Asia/Karachi');
    const cleanIfaTz = isValidTimezone(ifaTz) ? ifaTz : resolveTimezone(cleanIfaCity, undefined, 'Europe/London');

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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingCities(true)}
            className="px-4 py-2 rounded-full border border-border bg-surface-hover text-xs font-bold text-text-main hover:border-pastel-pink-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-pastel-pink-400" /> Set Our Cities
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWriteModal(true)}
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

        {/* ROW 3: "OPEN WHEN..." DIGITAL ENVELOPES */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
                <span>"Open When..." Sealed Letters</span>
                <Mail className="w-4 h-4 text-pastel-pink-400" />
              </h3>
              <p className="text-xs text-text-muted font-medium">
                Wax-sealed emotional first-aid envelopes written just for your heart.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {letters.map((letter) => (
              <motion.div
                key={letter.id}
                whileHover={{ scale: 1.03, y: -3 }}
                onClick={() => handleOpenLetter(letter)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between min-h-[170px] relative shadow-md will-change-transform ${
                  letter.isOpened
                    ? 'bg-surface-hover/70 border-border'
                    : 'bg-gradient-to-br from-white via-pastel-pink-50 to-pastel-pink-100/50 dark:from-surface dark:via-surface dark:to-pastel-pink-950/20 border-pastel-pink-300 dark:border-pastel-pink-400/40 shadow-pastel-pink-100/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400">
                      From {letter.sender}
                    </span>
                    <span className="text-xs">
                      {letter.isOpened ? '💌 Unsealed' : '🔒 Wax-Sealed'}
                    </span>
                  </div>

                  <h4 className="font-bold text-base font-serif-italic text-text-main line-clamp-2 leading-snug">
                    {letter.title}
                  </h4>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-text-muted">
                  <span>{letter.isOpened ? 'Click to re-read' : 'Tap to break seal 💕'}</span>
                  <Heart className="w-3.5 h-3.5 text-pastel-pink-400 fill-pastel-pink-400" />
                </div>
              </motion.div>
            ))}
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
                      { city: 'Islamabad, PK', tz: 'Asia/Karachi', label: 'Islamabad' },
                      { city: 'Karachi, PK', tz: 'Asia/Karachi', label: 'Karachi' },
                      { city: 'Dubai, UAE', tz: 'Asia/Dubai', label: 'Dubai' },
                      { city: 'London, UK', tz: 'Europe/London', label: 'London' },
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
                        if (foundCity && (!mahadCity || mahadCity.includes('Lahore') || mahadCity.includes('London'))) {
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
                      if (detected && detected !== 'Europe/London') {
                        setIfaTz(detected);
                      }
                    }}
                    placeholder="City Name (e.g. London, UK)"
                    className="w-full bg-surface p-2.5 rounded-xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
                    required
                  />

                  {/* Quick Presets for Ifa */}
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {[
                      { city: 'London, UK', tz: 'Europe/London', label: 'London' },
                      { city: 'Manchester, UK', tz: 'Europe/London', label: 'Manchester' },
                      { city: 'Birmingham, UK', tz: 'Europe/London', label: 'Birmingham' },
                      { city: 'Lahore, PK', tz: 'Asia/Karachi', label: 'Lahore' },
                      { city: 'Dubai, UAE', tz: 'Asia/Dubai', label: 'Dubai' },
                      { city: 'New York, US', tz: 'America/New_York', label: 'New York' }
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
                        if (foundCity && (!ifaCity || ifaCity.includes('London') || ifaCity.includes('Lahore'))) {
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

      {/* READ LETTER MODAL */}
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
              className="max-w-lg w-full rounded-[2.5rem] p-8 md:p-10 glass-panel border border-border shadow-2xl flex flex-col bg-surface relative"
            >
              <button
                onClick={() => setSelectedLetter(null)}
                className="absolute top-6 right-6 p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pastel-pink-400 mb-2">
                <Mail className="w-4 h-4" />
                <span>Written with love by {selectedLetter.sender}</span>
              </div>

              <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-6 leading-tight">
                {selectedLetter.title}
              </h3>

              <div className="max-h-[50vh] overflow-y-auto pr-2 text-sm leading-relaxed text-text-main/90 font-medium whitespace-pre-wrap font-sans border-t border-b border-border/40 py-4 my-2">
                {selectedLetter.content}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                <span>For: {selectedLetter.recipient}</span>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="px-5 py-2 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Keep in Heart 💕
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WRITE NEW SEALED LETTER MODAL */}
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
              <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-2">Write "Open When..." Letter</h3>
              <p className="text-xs text-text-muted mb-4 font-medium">
                Write a sealed letter for {currentUser === 'Mahad' ? 'Ifa' : 'Mahad'} to open when they need you most.
              </p>

              <form onSubmit={handleSaveNewLetter} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Envelope Label (e.g. Open when you feel lonely...)"
                  value={newLetterTitle}
                  onChange={(e) => setNewLetterTitle(e.target.value)}
                  className="bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400"
                  required
                  autoFocus
                />
                <textarea
                  placeholder="Pour your heart out here. This envelope will stay sealed until they tap it..."
                  value={newLetterContent}
                  onChange={(e) => setNewLetterContent(e.target.value)}
                  rows={6}
                  className="bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400 resize-none leading-relaxed font-sans"
                  required
                />

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowWriteModal(false)}
                    className="px-5 py-2.5 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Seal Envelope 💌
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
