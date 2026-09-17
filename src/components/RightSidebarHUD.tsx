import { useState, useEffect } from 'react';
import { Clock, MapPin, Moon, Sparkles } from 'lucide-react';
import { useFirestore } from '../firebase';
import { resolveTimezone, formatTimeInZone, getNetworkDate, getNetworkNow } from '../utils/timezone';

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
    <div className={`p-5 rounded-[1.5rem] glass-panel border border-border flex flex-col justify-between overflow-hidden relative ${
      isDaytime 
        ? 'bg-gradient-to-br from-amber-500/20 to-surface/40' 
        : 'bg-gradient-to-br from-indigo-900/40 to-surface/40'
    }`}>
      {/* Decorative time-of-day icon */}
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

export default function RightSidebarHUD({ currentUser }: { currentUser: 'Mahad' | 'Ifa' }) {
  // Pull settings from Firebase
  const settingsArray = useFirestore<any>('userSettings', 'id', false) || [];
  
  const globalSettings = settingsArray.find(s => s.id === 'global') || {};
  const mahadSettings = settingsArray.find(s => s.id === 'Mahad') || {};
  const ifaSettings = settingsArray.find(s => s.id === 'Ifa') || {};

  const reunionDateStr = globalSettings.reunionDate || localStorage.getItem('tulip_reunion_date') || '2026-10-25';
  const inLoveSinceStr = globalSettings.relationshipStart || localStorage.getItem('tulip_relationship_start') || '2023-08-14';

  const mahadCity = mahadSettings.city || localStorage.getItem('tulip_mahad_city') || 'Lahore, PK';
  const mahadTz = mahadSettings.tz || localStorage.getItem('tulip_mahad_tz') || 'Asia/Karachi';
  const ifaCity = ifaSettings.city || localStorage.getItem('tulip_ifa_city') || 'London, UK';
  const ifaTz = ifaSettings.tz || localStorage.getItem('tulip_ifa_tz') || 'Europe/London';

  const [inLoveSince, setInLoveSince] = useState(() => new Date(`${inLoveSinceStr}T00:00:00`).getTime());
  useEffect(() => {
    setInLoveSince(new Date(`${inLoveSinceStr}T00:00:00`).getTime());
  }, [inLoveSinceStr]);

  const [loveTimer, setLoveTimer] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = getNetworkNow();
      const diff = Math.max(0, now - inLoveSince);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setLoveTimer(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [inLoveSince]);

  const target = new Date(reunionDateStr + 'T00:00:00').getTime();
  const diff = target - getNetworkNow();
  const daysLeft = diff <= 0 ? 0 : Math.ceil(diff / (1000 * 60 * 60 * 24));

  return (
    <div className="w-80 hidden lg:flex flex-col gap-5 h-full overflow-y-auto pl-6 pr-2 pb-6 scrollbar-hide shrink-0 pt-2 border-l border-border/50">
      
      {/* Live Timer */}
      <div className="p-5 rounded-[1.5rem] glass-panel border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-pastel-pink-400/10 to-transparent pointer-events-none" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400 mb-1 relative z-10">
          In Love For
        </span>
        <h3 className="text-2xl font-bold font-sans text-text-main tabular-nums relative z-10 tracking-tight">
          {loveTimer || '...'}
        </h3>
      </div>

      {/* Reunion Countdown Card */}
      <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-pastel-pink-400 to-pastel-pink-300 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 leading-tight">
            Next Time We See Each Other 💕
          </span>
        </div>
        <div className="my-1">
          <h3 className="text-4xl font-bold font-sans tabular-nums tracking-tight">
            {daysLeft} <span className="text-base font-sans font-medium">Days</span>
          </h3>
          <p className="text-xs text-white/90 mt-1 font-medium leading-tight">
            {daysLeft === 0
              ? 'Today is the day we hug! 💕'
              : `Until we are wrapped in each other's arms`}
          </p>
        </div>
      </div>

      {/* World Clocks */}
      <div className="flex flex-col gap-4 mt-2">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted px-1 flex items-center gap-2">
          <span>Global Bridge</span>
          <div className="h-px bg-border flex-1" />
        </h4>
        <WorldClock 
          timezone={mahadTz} 
          city={mahadCity} 
          label="Mahad's Clock 🌹" 
          icon={Clock} 
        />
        <WorldClock 
          timezone={ifaTz} 
          city={ifaCity} 
          label="Ifa's Clock 🌷" 
          icon={Moon} 
        />
      </div>

    </div>
  );
}
