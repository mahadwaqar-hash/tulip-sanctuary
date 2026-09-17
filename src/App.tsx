import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Heart, 
  Moon, 
  Sun, 
  Lock, 
  Unlock,
  KeyRound,
  MessageSquare,
  Calendar as CalendarIcon,
  Camera,
  FileText,
  Sparkles,
  Plane,
  Settings,
  X,
  ShieldCheck
} from 'lucide-react';
import ChatSanctuary from './components/ChatSanctuary';
import CalendarView from './components/CalendarView';
import SecretPhotosView from './components/SecretPhotosView';
import ScratchpadView from './components/ScratchpadView';
import LdrSanctuaryView from './components/LdrSanctuaryView';
import FullScreenLoveBurst, { type LoveBurstType } from './components/FullScreenLoveBurst';
import AmbientFairytaleDecor from './components/AmbientFairytaleDecor';
import RightSidebarHUD from './components/RightSidebarHUD';
import { useFirestore, fb } from './firebase';

const springConfig: Transition = { type: 'spring', bounce: 0.6, duration: 0.8 };

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  // 50/50 Chance between "Mahad loves Ifa" and "Ifa loves Mahad"
  const loveMessage = useMemo(() => {
    return Math.random() < 0.5 
      ? { first: 'Mahad', relation: 'loves', second: 'Ifa', subtitle: 'Forever & Always 💕' }
      : { first: 'Ifa', relation: 'loves', second: 'Mahad', subtitle: 'To the Moon & Back ✨' };
  }, []);

  useEffect(() => {
    const timer = setTimeout(onComplete, 2600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-bg-start via-bg-end to-bg-start overflow-hidden select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Floating Fairy Dust Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              x: (Math.random() - 0.5) * 600, 
              y: (Math.random() - 0.5) * 600 
            }}
            animate={{ 
              opacity: [0, 0.7, 0],
              scale: [0.5, 1.4, 0.8],
              y: [(Math.random() - 0.5) * 600, (Math.random() - 0.5) * 600 - 80]
            }}
            transition={{ duration: 2.4, repeat: Infinity, delay: Math.random() * 1.5 }}
            className="absolute text-pastel-pink-400/60 top-1/2 left-1/2 text-sm"
          >
            {i % 2 === 0 ? '✨' : '🌸'}
          </motion.div>
        ))}
      </div>

      <div className="relative flex flex-col items-center justify-center">
        {/* Glowing Beating Heart Behind Typography */}
        <motion.div 
          animate={{ scale: [1, 1.22, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute z-0 drop-shadow-[0_0_60px_rgba(255,102,133,0.6)]"
        >
          <Heart className="w-80 h-80 sm:w-96 sm:h-96 text-pastel-pink-400 fill-pastel-pink-400/90" />
        </motion.div>
        
        {/* Typography Content */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, type: "spring", bounce: 0.4 }}
          className="z-10 text-center relative px-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md border border-pastel-pink-300/40 text-[11px] font-bold text-pastel-pink-400 uppercase tracking-widest mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Private Sanctuary</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl text-text-main font-serif-italic tracking-tight drop-shadow-sm leading-tight">
            {loveMessage.first} <span className="text-pastel-pink-400 font-fairytale text-5xl sm:text-7xl md:text-8xl lowercase px-1.5">{loveMessage.relation}</span> {loveMessage.second}
          </h1>

          <p className="font-handwriting text-xl sm:text-2xl text-text-muted mt-3">
            {loveMessage.subtitle}
          </p>

          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            transition={{ delay: 0.3, duration: 1.8, ease: "easeInOut" }}
            className="h-1 bg-gradient-to-r from-transparent via-pastel-pink-400 to-transparent mt-6 rounded-full mx-auto"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

// STEP 1: Password Gate Screen
function PasswordLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = password.trim().toLowerCase();
    const customPass = (localStorage.getItem('tulip_custom_sanctuary_pass') || '2026').trim().toLowerCase();

    if (clean === customPass || clean === 'ifa' || clean === 'mahad' || clean === '2026') {
      if ('vibrate' in navigator) navigator.vibrate([40, 40]);
      onUnlock();
    } else {
      setError(true);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-br from-bg-start via-bg-end to-bg-start select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springConfig}
        className="w-full max-w-sm p-8 md:p-10 rounded-[3rem] glass-panel border border-pastel-pink-200/50 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Fairy Sparkle Ornament */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pastel-pink-300 via-pastel-pink-400 to-pastel-peach" />

        <div className="w-18 h-18 rounded-full bg-gradient-to-br from-pastel-pink-200 to-pastel-pink-400 text-white flex items-center justify-center mb-5 shadow-lg glow-rose-sm">
          <KeyRound className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-bold font-serif-italic text-text-main">A.I.M. Sanctuary</h2>
        <span className="font-fairytale text-2xl text-pastel-pink-400 lowercase -mt-1 mb-2">always ifa & mahad</span>
        <p className="text-xs text-text-muted mb-6 font-medium">
          Exclusive haven for Mahad & Ifa. Whisper the secret passcode to enter.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            placeholder="Secret passcode..."
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            autoFocus
            className={`w-full py-4 px-6 rounded-full bg-surface-hover/80 border ${
              error ? 'border-red-400 text-red-500' : 'border-pastel-pink-200/50 text-text-main'
            } text-center font-medium text-sm outline-none focus:border-pastel-pink-400 focus:ring-4 focus:ring-pastel-pink-300/20 transition-all shadow-inner`}
          />

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-4 rounded-full bg-gradient-to-r from-pastel-pink-400 to-pastel-pink-300 text-white font-bold text-xs uppercase tracking-widest shadow-lg glow-rose-sm hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            Enter Our Sanctuary
          </motion.button>
        </form>

        <span className="text-[11px] text-text-muted/70 mt-6 font-medium">
          Hint: <span className="text-pastel-pink-400 font-bold">ifa</span>, <span className="text-pastel-pink-400 font-bold">mahad</span> or <span className="text-pastel-pink-400 font-bold">2026</span>
        </span>
      </motion.div>
    </div>
  );
}

// STEP 2: Profile Selection Screen (Mahad or Ifa)
function ProfileSelectScreen({ onSelect }: { onSelect: (user: 'Mahad' | 'Ifa') => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gradient-to-br from-bg-start via-bg-end to-bg-start select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springConfig}
        className="w-full max-w-md p-8 md:p-10 rounded-[3rem] glass-panel border border-pastel-pink-200/50 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pastel-pink-300 via-pastel-pink-400 to-pastel-peach" />

        <div className="w-16 h-16 rounded-full bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center mb-4 shadow-sm">
          <Sparkles className="w-8 h-8 animate-spin-slow" />
        </div>

        <h2 className="text-3xl font-bold font-serif-italic text-text-main">Welcome Home</h2>
        <span className="font-fairytale text-2xl text-pastel-pink-400 lowercase -mt-1 mb-2">choose your crown</span>
        <p className="text-xs text-text-muted mb-8 font-medium">
          Who is arriving at our sanctuary today?
        </p>

        <div className="grid grid-cols-2 gap-5 w-full">
          {/* Mahad Card */}
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect('Mahad')}
            className="p-6 rounded-3xl bg-surface-hover/80 border-2 border-border hover:border-pastel-pink-400 shadow-md flex flex-col items-center gap-3 transition-all cursor-pointer group"
          >
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 dark:from-pastel-pink-400 dark:to-pastel-pink-300 text-white flex items-center justify-center text-3xl font-serif-italic font-bold shadow-lg group-hover:rotate-6 transition-transform">
              M
            </div>
            <div>
              <h4 className="font-bold text-base text-text-main font-serif-italic">Mahad</h4>
              <span className="text-[11px] text-pastel-pink-400 font-bold uppercase tracking-wider block mt-0.5">
                Handsome Boy 🌹
              </span>
            </div>
          </motion.button>

          {/* Ifa Card */}
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect('Ifa')}
            className="p-6 rounded-3xl bg-surface-hover/80 border-2 border-border hover:border-pastel-pink-400 shadow-md flex flex-col items-center gap-3 transition-all cursor-pointer group"
          >
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-pastel-pink-300 to-pastel-pink-400 text-white flex items-center justify-center text-3xl font-serif-italic font-bold shadow-lg group-hover:-rotate-6 transition-transform glow-rose-sm">
              I
            </div>
            <div>
              <h4 className="font-bold text-base text-text-main font-serif-italic">Ifa</h4>
              <span className="text-[11px] text-pastel-pink-400 font-bold uppercase tracking-wider block mt-0.5">
                Pretty Girl 🌷
              </span>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// Settings Modal for changing passcodes
function PasswordSettingsModal({ onClose }: { onClose: () => void }) {
  const [sanctuaryPass, setSanctuaryPass] = useState(() => {
    return localStorage.getItem('tulip_custom_sanctuary_pass') || '';
  });
  const [photoPass, setPhotoPass] = useState(() => {
    return localStorage.getItem('tulip_custom_photo_pass') || '';
  });
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (sanctuaryPass.trim()) {
      localStorage.setItem('tulip_custom_sanctuary_pass', sanctuaryPass.trim());
    }
    if (photoPass.trim()) {
      localStorage.setItem('tulip_custom_photo_pass', photoPass.trim());
    }
    setSavedNotice(true);
    if ('vibrate' in navigator) navigator.vibrate(50);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-md w-full p-8 rounded-[2.5rem] glass-panel border border-border shadow-2xl flex flex-col bg-surface relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-pastel-pink-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Passcodes</span>
        </div>

        <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-1">Update Passcodes</h3>
        <p className="text-xs text-text-muted mb-6">
          Change the password required to enter the website and the secret scrapbook.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
              Sanctuary Gate Passcode
            </label>
            <input
              type="text"
              value={sanctuaryPass}
              onChange={(e) => setSanctuaryPass(e.target.value)}
              placeholder="e.g. ifa / mahad / 2026 or custom"
              className="w-full bg-surface-hover p-3.5 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
              Secret Photo Scrapbook Passcode
            </label>
            <input
              type="text"
              value={photoPass}
              onChange={(e) => setPhotoPass(e.target.value)}
              placeholder="e.g. 2026 or sweet code"
              className="w-full bg-surface-hover p-3.5 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-hover rounded-2xl border border-border mt-2">
            <div>
              <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
                Visual Theme
              </label>
              <span className="text-[11px] text-text-muted">Toggle between Light and OLED Dark</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark) {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('tulip_theme', 'light');
                  window.dispatchEvent(new Event('theme_changed'));
                } else {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('tulip_theme', 'dark');
                  window.dispatchEvent(new Event('theme_changed'));
                }
              }}
              className="p-3 bg-pastel-pink-400 text-white rounded-full shadow-md cursor-pointer hover:scale-105 transition-transform"
            >
              <Sun className="w-4 h-4 dark:hidden" />
              <Moon className="w-4 h-4 hidden dark:block" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            {savedNotice ? (
              <span className="text-xs font-bold text-emerald-500 animate-pulse">
                ✓ Saved!
              </span>
            ) : <span />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hasUnlockedPasscode, setHasUnlockedPasscode] = useState(() => {
    return sessionStorage.getItem('tulip_pass_unlocked') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<'Mahad' | 'Ifa' | null>(() => {
    return (sessionStorage.getItem('tulip_user') as 'Mahad' | 'Ifa') || null;
  });

  const [activeTab, setActiveTab] = useState<'chat' | 'ldr' | 'calendar' | 'photos' | 'scratchpad'>('chat');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('tulip_theme') !== 'light'; // Default to dark OLED
  });
  const [showSettings, setShowSettings] = useState(false);

  // Global Full Screen Love Burst state
  const [currentBurst, setCurrentBurst] = useState<{ type: LoveBurstType; sender: 'Mahad' | 'Ifa' } | null>(null);

  const lovePings = useFirestore<any>('lovePings', 'createdAt', false);

  useEffect(() => {
    if (!currentUser || !lovePings.length) return;
    // Find pings meant for the current user
    const pingsForMe = lovePings.filter(p => p.recipient === currentUser);
    if (pingsForMe.length > 0) {
      const ping = pingsForMe[0];
      setCurrentBurst({ type: ping.type, sender: ping.sender });
      fb.lovePings.delete(ping.id); // Delete after receiving so we don't see it again
    }
  }, [lovePings, currentUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tulip_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tulip_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleThemeChange = () => {
      setDarkMode(localStorage.getItem('tulip_theme') !== 'light');
    };
    window.addEventListener('theme_changed', handleThemeChange);
    return () => window.removeEventListener('theme_changed', handleThemeChange);
  }, []);

  const handlePasscodeUnlock = () => {
    setHasUnlockedPasscode(true);
    sessionStorage.setItem('tulip_pass_unlocked', 'true');
  };

  const handleUserSelect = (user: 'Mahad' | 'Ifa') => {
    setCurrentUser(user);
    sessionStorage.setItem('tulip_user', user);
  };

  const handleLock = () => {
    setHasUnlockedPasscode(false);
    setCurrentUser(null);
    sessionStorage.removeItem('tulip_pass_unlocked');
    sessionStorage.removeItem('tulip_user');
  };

  const TABS = [
    { id: 'chat', label: 'Our Chat', emoji: '💬', icon: MessageSquare },
    { id: 'ldr', label: 'LDR Sanctuary', emoji: '💌', icon: Plane },
    { id: 'calendar', label: 'Our Calendar', emoji: '📅', icon: CalendarIcon },
    { id: 'photos', label: 'Secret Scrapbook', emoji: '📸', icon: Camera },
    { id: 'scratchpad', label: 'Love Notes', emoji: '📝', icon: FileText },
  ];

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {/* AMBIENT FLOATING FAIRYTALE DUST & PETALS */}
      <AmbientFairytaleDecor />

      {/* FULL SCREEN DISNEY STYLE LOVE BURST OVERLAY */}
      <FullScreenLoveBurst
        burst={currentBurst}
        onDismiss={() => setCurrentBurst(null)}
      />

      {/* STEP 1: PASSWORD GATE */}
      {!loading && !hasUnlockedPasscode && (
        <PasswordLockScreen onUnlock={handlePasscodeUnlock} />
      )}

      {/* STEP 2: USER SELECTION GATE */}
      {!loading && hasUnlockedPasscode && !currentUser && (
        <ProfileSelectScreen onSelect={handleUserSelect} />
      )}

      {/* STEP 3: MAIN SANCTUARY */}
      {!loading && hasUnlockedPasscode && currentUser && (
        <div className="h-[100dvh] w-full flex flex-col p-3 md:p-6 max-w-[1600px] mx-auto overflow-hidden transition-colors duration-500 relative z-10">
          
          {/* CUTESY TOP HEADER & TELEMETRY (Condensed for Mobile, Hidden on Desktop) */}
          <div className="lg:hidden flex items-center justify-between pb-3 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pastel-pink-300 to-pastel-pink-400 text-white shadow-md glow-rose-sm flex items-center justify-center">
                <Heart className="w-4 h-4 fill-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-text-main leading-tight flex items-center gap-1.5 font-serif-italic">
                  A.I.M. <span className="text-pastel-pink-400 font-fairytale text-xl lowercase whitespace-nowrap hidden sm:inline">Always Ifa & Mahad</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-text-main">
              <button
                onClick={() => setCurrentUser(currentUser === 'Mahad' ? 'Ifa' : 'Mahad')}
                className="font-bold text-pastel-pink-400 hover:underline cursor-pointer flex items-center gap-1 px-2 py-1 rounded-full bg-pastel-pink-100/60 dark:bg-pastel-pink-400/20"
              >
                <span>{currentUser}</span>
                <span>{currentUser === 'Mahad' ? '🌹' : '🌷'}</span>
              </button>
            </div>
          </div>

          {/* MAIN 3-PANE LAYOUT */}
          <div className="flex-1 w-full h-full overflow-hidden flex flex-col lg:flex-row relative">
            
            {/* LEFT SIDEBAR (Desktop Only) */}
            <div className="hidden lg:flex flex-col w-60 shrink-0 h-full border-r border-border/50 pr-6 pt-4 gap-8">
              <div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-pastel-pink-300 to-pastel-pink-400 text-white shadow-lg glow-rose-sm flex items-center justify-center w-12 h-12 mb-4">
                  <Heart className="w-6 h-6 fill-white animate-pulse" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-text-main leading-tight flex flex-col gap-0 font-serif-italic mb-1">
                  <span>A.I.M.</span>
                  <span className="text-pastel-pink-400 font-fairytale text-2xl lowercase translate-y-0.5 whitespace-nowrap">Always Ifa & Mahad</span>
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium mt-3">
                  <span>Logged in as</span>
                  <button
                    onClick={() => setCurrentUser(currentUser === 'Mahad' ? 'Ifa' : 'Mahad')}
                    className="font-bold text-pastel-pink-400 hover:underline cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full bg-pastel-pink-100/60 dark:bg-pastel-pink-400/20 transition-colors"
                  >
                    <span>{currentUser}</span>
                    <span>{currentUser === 'Mahad' ? '🌹' : '🌷'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 px-3">Sanctuary</span>
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer flex items-center gap-3 shadow-xs ${
                        isActive
                          ? 'bg-gradient-to-r from-pastel-pink-400 to-pastel-pink-300 text-white shadow-md shadow-pastel-pink-300/50 glow-rose-sm'
                          : 'bg-surface/50 glass-panel border border-transparent text-text-muted hover:text-text-main hover:bg-surface-hover hover:border-border/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 px-3">Settings</span>
                <button onClick={() => setShowSettings(true)} className="px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-3 text-text-muted hover:text-pastel-pink-400 hover:bg-surface-hover transition-colors cursor-pointer text-left">
                  <Settings className="w-4 h-4" /> Passcodes
                </button>
                <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-3 text-text-muted hover:text-pastel-pink-400 hover:bg-surface-hover transition-colors cursor-pointer text-left">
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} Theme
                </button>
                <button onClick={handleLock} className="px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-3 text-text-muted hover:text-red-400 hover:bg-surface-hover transition-colors cursor-pointer text-left">
                  <Lock className="w-4 h-4" /> Lock Sanctuary
                </button>
              </div>
            </div>

            {/* CENTER COLUMN (Active View) */}
            <div className="flex-1 h-full w-full flex flex-col overflow-hidden pb-16 lg:pb-0">
              <div className="w-full h-full max-w-4xl mx-auto lg:px-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'chat' && (
                    <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full pt-1 lg:pt-4 pb-2">
                      <ChatSanctuary currentUser={currentUser} />
                    </motion.div>
                  )}
                  {activeTab === 'ldr' && (
                    <motion.div key="ldr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full pt-1 lg:pt-4 pb-2">
                      <LdrSanctuaryView
                        currentUser={currentUser}
                        onTriggerBurst={(type, sender) => setCurrentBurst({ type, sender })}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'calendar' && (
                    <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full pt-1 lg:pt-4 pb-2">
                      <CalendarView currentUser={currentUser} />
                    </motion.div>
                  )}
                  {activeTab === 'photos' && (
                    <motion.div key="photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full pt-1 lg:pt-4 pb-2">
                      <SecretPhotosView currentUser={currentUser} />
                    </motion.div>
                  )}
                  {activeTab === 'scratchpad' && (
                    <motion.div key="scratchpad" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full pt-1 lg:pt-4 pb-2">
                      <ScratchpadView currentUser={currentUser} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT SIDEBAR HUD (Desktop Only) */}
            <RightSidebarHUD currentUser={currentUser} />
            
          </div>

          {/* BOTTOM NAVIGATION BAR (Mobile Only) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-3 pb-safe bg-surface/90 backdrop-blur-xl border-t border-border shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl w-14 transition-all cursor-pointer ${
                      isActive
                        ? 'text-pastel-pink-400'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-pastel-pink-400/15 shadow-sm' : ''}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'fill-pastel-pink-400/20' : ''}`} />
                    </div>
                    <span className="text-[9px] font-bold mt-1 tracking-tight truncate w-full text-center">{tab.label.split(' ')[0]}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* PASSWORD SETTINGS MODAL */}
          <AnimatePresence>
            {showSettings && (
              <PasswordSettingsModal onClose={() => setShowSettings(false)} />
            )}
          </AnimatePresence>

        </div>
      )}
    </>
  );
}
