import { useState } from 'react';
import { motion, type Transition } from 'framer-motion';
import { 
  Sparkles, 
  Heart, 
  Volume2, 
  HelpCircle, 
  RefreshCw, 
  Droplet, 
  Gift, 
  Check
} from 'lucide-react';

const springConfig: Transition = { type: 'spring', stiffness: 350, damping: 25 };

interface CoupleWidgetsViewProps {
  currentUser?: 'Mahad' | 'Ifa';
}

const DAILY_QUESTIONS = [
  "What is your absolute favorite memory of us from this past month?",
  "What is one tiny habit of mine that secretly makes you smile?",
  "If we could teleport to any city right now for just one evening, where would we go?",
  "What was the exact moment you knew I had your whole heart?",
  "What is our song that always feels like a warm hug when you listen to it?",
  "What is one thing you can't wait to do when we're together in our own home?",
  "What was the first thing you thought when you first saw my face?",
  "If we had a lazy rainy Sunday with no phones, how would we spend it?"
];

const COMPLIMENTS = [
  "You make the whole world feel softer and kinder just by existing.",
  "Your smile is my favorite visual art in the universe.",
  "Loving you is the easiest, most natural thing I have ever done.",
  "You are both my safest shelter and my sweetest adventure.",
  "Even on your most tired days, you are effortlessly radiant to me.",
  "My heart beats in your accent."
];

const COUPONS = [
  { id: '1', title: 'Free 30-min Massage 💆', desc: 'No complaints, all tension melted away.' },
  { id: '2', title: 'You Pick Tonight’s Movie 🍿', desc: 'Even if it’s a 3-hour documentary or rom-com.' },
  { id: '3', title: 'Breakfast in Bed 🥞', desc: 'Warm tea, toast, and gentle forehead kisses.' },
  { id: '4', title: 'Win Any Minor Argument 🏆', desc: 'Instant surrender, you were right all along.' },
  { id: '5', title: 'Late Night Dessert Delivery 🍰', desc: 'Craving satisfied, no questions asked.' }
];

export default function CoupleWidgetsView({ currentUser: _currentUser }: CoupleWidgetsViewProps) {
  // Widget 1: Tulip Garden Pet
  const [waterCount, setWaterCount] = useState(() => {
    return parseInt(localStorage.getItem('tulip_water_count') || '3', 10);
  });
  const [justWatered, setJustWatered] = useState(false);

  // Widget 2: Daily Question
  const [questionIdx, setQuestionIdx] = useState(0);

  // Widget 3: Love Fortune
  const [complimentIdx, setComplimentIdx] = useState(0);

  // Widget 4: Ambient Audio Sim
  const [ambientPlaying, setAmbientPlaying] = useState<'none' | 'rain' | 'fire'>('none');

  // Widget 5: Relationship Days Together
  const [startDateStr, setStartDateStr] = useState(() => {
    return localStorage.getItem('tulip_relationship_start') || '2023-08-14';
  });
  const [isEditingStart, setIsEditingStart] = useState(false);

  // Widget 6: Redeemed Coupons
  const [redeemedCoupons, setRedeemedCoupons] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tulip_redeemed_coupons') || '[]');
    } catch {
      return [];
    }
  });

  const handleWaterTulip = () => {
    if ('vibrate' in navigator) navigator.vibrate([40, 60]);
    const next = waterCount + 1;
    setWaterCount(next);
    localStorage.setItem('tulip_water_count', next.toString());
    setJustWatered(true);
    setTimeout(() => setJustWatered(false), 2000);
  };

  const handleRedeemCoupon = (id: string) => {
    if ('vibrate' in navigator) navigator.vibrate(50);
    const updated = redeemedCoupons.includes(id)
      ? redeemedCoupons.filter(c => c !== id)
      : [...redeemedCoupons, id];
    setRedeemedCoupons(updated);
    localStorage.setItem('tulip_redeemed_coupons', JSON.stringify(updated));
  };

  // Calculate Days Together
  const calculateDaysTogether = () => {
    const start = new Date(startDateStr + 'T00:00:00').getTime();
    const now = Date.now();
    const diff = now - start;
    if (diff <= 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const daysTogether = calculateDaysTogether();

  // Tulip growth stage
  const getTulipStage = () => {
    if (waterCount >= 15) return { stage: 'Full Blooming Rose Tulip 🌷', emoji: '🌷', desc: 'Flourishing with eternal care!' };
    if (waterCount >= 8) return { stage: 'Budding Flower 🌸', emoji: '🌸', desc: 'Growing strong every single day!' };
    return { stage: 'Baby Sprout 🌱', emoji: '🌱', desc: 'Water it together to help it blossom.' };
  };

  const tulipInfo = getTulipStage();

  return (
    <div className="flex-1 flex flex-col h-full rounded-[2.5rem] glass-panel shadow-2xl overflow-hidden border border-border">
      
      {/* HEADER */}
      <div className="px-8 py-5 border-b border-border bg-surface/80 backdrop-blur-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
              <span>Couple’s Enchanted Widget Hub</span>
              <Heart className="w-4 h-4 text-pastel-pink-400 fill-pastel-pink-400" />
            </h2>
            <p className="text-xs text-text-muted font-medium">
              A playful library of shared interactive widgets, daily prompts, and love tokens.
            </p>
          </div>
        </div>
      </div>

      {/* WIDGETS MASONRY / GRID */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* WIDGET 1: OUR VIRTUAL TULIP PET */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={springConfig}
            className="p-6 rounded-[2rem] glass-panel border border-border shadow-md flex flex-col justify-between bg-gradient-to-br from-surface to-pastel-pink-50/40 dark:to-pastel-pink-950/20"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400">
                Shared Pet Garden
              </span>
              <span className="text-xs font-bold text-text-muted">Lvl {waterCount}</span>
            </div>

            <div className="flex flex-col items-center text-center my-2">
              <motion.div
                animate={justWatered ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] } : {}}
                className="text-7xl mb-3 drop-shadow-md"
              >
                {tulipInfo.emoji}
              </motion.div>
              <h4 className="font-bold font-serif-italic text-lg text-text-main">{tulipInfo.stage}</h4>
              <p className="text-xs text-text-muted mt-1">{tulipInfo.desc}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleWaterTulip}
              className="mt-4 w-full py-3 rounded-2xl bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Droplet className="w-4 h-4 fill-white" />
              <span>Water Our Tulip Together</span>
            </motion.button>
          </motion.div>

          {/* WIDGET 2: DAYS TOGETHER COUNTER */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={springConfig}
            className="p-6 rounded-[2rem] glass-panel border border-border shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400">
                Love Milestone Clock
              </span>
              <button
                onClick={() => setIsEditingStart(!isEditingStart)}
                className="text-[11px] text-pastel-pink-400 hover:underline cursor-pointer"
              >
                {isEditingStart ? 'Done' : 'Set Date'}
              </button>
            </div>

            {isEditingStart ? (
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => {
                  setStartDateStr(e.target.value);
                  localStorage.setItem('tulip_relationship_start', e.target.value);
                }}
                className="p-2 rounded-xl bg-surface-hover border border-border text-text-main text-xs outline-none"
              />
            ) : (
              <div className="my-3 text-center">
                <span className="text-xs text-text-muted uppercase tracking-wider font-semibold">We Have Been In Love For</span>
                <h3 className="text-5xl font-bold font-serif-italic text-text-main mt-1">
                  {daysTogether} <span className="text-lg font-sans font-medium text-pastel-pink-400">Days</span>
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  Around {(daysTogether * 24).toLocaleString()} hours of knowing you.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-border/40 text-[11px] text-text-muted text-center">
              Since {new Date(startDateStr + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} 💕
            </div>
          </motion.div>

          {/* WIDGET 3: 365 COUPLE QUESTIONS */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={springConfig}
            className="p-6 rounded-[2rem] glass-panel border border-border shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Daily Couple Question</span>
              </span>
              <button
                onClick={() => setQuestionIdx((questionIdx + 1) % DAILY_QUESTIONS.length)}
                className="p-1.5 rounded-full hover:bg-surface-hover text-text-muted hover:text-text-main transition-colors cursor-pointer"
                title="Next Question"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-base font-serif-italic font-bold text-text-main leading-relaxed my-3">
              "{DAILY_QUESTIONS[questionIdx]}"
            </p>

            <span className="text-[11px] text-text-muted">
              Talk about this on your next late night call or in chat!
            </span>
          </motion.div>

          {/* WIDGET 4: DAILY LOVE FORTUNE / COMPLIMENT */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={springConfig}
            className="p-6 rounded-[2rem] glass-panel border border-border shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-pastel-pink-400" />
                <span>Sweet Reminder for You</span>
              </span>
              <button
                onClick={() => setComplimentIdx((complimentIdx + 1) % COMPLIMENTS.length)}
                className="p-1.5 rounded-full hover:bg-surface-hover text-text-muted hover:text-text-main transition-colors cursor-pointer"
                title="Shuffle Compliment"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-base font-serif-italic font-medium text-text-main leading-relaxed my-3">
              "{COMPLIMENTS[complimentIdx]}"
            </p>

            <span className="text-[11px] text-text-muted">
              Tap the shuffle icon anytime you need a smile.
            </span>
          </motion.div>

          {/* WIDGET 5: COZY AMBIENT SOUNDSCAPE */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={springConfig}
            className="p-6 rounded-[2rem] glass-panel border border-border shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400">
                Cozy Couple Soundscape
              </span>
              <Volume2 className="w-4 h-4 text-pastel-pink-400" />
            </div>

            <p className="text-xs text-text-muted mb-4">
              Turn on simulated soothing audio while chatting or reading love notes:
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setAmbientPlaying(ambientPlaying === 'rain' ? 'none' : 'rain')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  ambientPlaying === 'rain' ? 'bg-pastel-pink-400 text-white shadow-sm' : 'bg-surface-hover text-text-main'
                }`}
              >
                <span>🌧️ Midnight Rain on Window</span>
                <span>{ambientPlaying === 'rain' ? 'Playing • Stop' : 'Play'}</span>
              </button>
              <button
                onClick={() => setAmbientPlaying(ambientPlaying === 'fire' ? 'none' : 'fire')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  ambientPlaying === 'fire' ? 'bg-pastel-pink-400 text-white shadow-sm' : 'bg-surface-hover text-text-main'
                }`}
              >
                <span>🔥 Crackling Storybook Fireplace</span>
                <span>{ambientPlaying === 'fire' ? 'Playing • Stop' : 'Play'}</span>
              </button>
            </div>
          </motion.div>

          {/* WIDGET 6: REDEEMABLE LOVE COUPONS */}
          <motion.div
            whileHover={{ y: -3 }}
            transition={springConfig}
            className="p-6 rounded-[2rem] glass-panel border border-border shadow-md flex flex-col justify-between md:col-span-2 lg:col-span-3"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-pastel-pink-400 flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                <span>Sanctuary Love Token & Coupon Book</span>
              </span>
              <span className="text-xs text-text-muted">Tap to redeem anytime!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {COUPONS.map((coupon) => {
                const isRedeemed = redeemedCoupons.includes(coupon.id);
                return (
                  <motion.div
                    key={coupon.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleRedeemCoupon(coupon.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isRedeemed
                        ? 'bg-emerald-500/10 border-emerald-500/30 line-through opacity-70'
                        : 'bg-surface-hover border-border hover:border-pastel-pink-400 shadow-xs'
                    }`}
                  >
                    <div>
                      <h5 className="font-bold text-xs text-text-main">{coupon.title}</h5>
                      <p className="text-[10px] text-text-muted mt-1 leading-snug">{coupon.desc}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase mt-3 pt-2 border-t border-border/30 text-pastel-pink-400 flex items-center gap-1">
                      {isRedeemed ? <><Check className="w-3 h-3" /> Redeemed</> : 'Tap to Claim'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
}
