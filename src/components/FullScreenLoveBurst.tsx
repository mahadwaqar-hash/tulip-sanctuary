import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, X } from 'lucide-react';

export type LoveBurstType = 'kiss' | 'hug' | 'thinking' | 'stars';

interface FullScreenLoveBurstProps {
  burst: {
    type: LoveBurstType;
    sender: 'Mahad' | 'Ifa';
  } | null;
  onDismiss: () => void;
}

export default function FullScreenLoveBurst({ burst, onDismiss }: FullScreenLoveBurstProps) {
  if (!burst) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md cursor-pointer overflow-hidden select-none"
      >
        {/* DISMISS BUTTON */}
        <button
          onClick={onDismiss}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors z-50 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 1. KISS ANIMATION: VINTAGE DISNEY FAIRYTALE KISSES & PETAL SHOWER */}
        {burst.type === 'kiss' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Ambient Golden Fairy Glow */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(255, 100, 150, 0.4) 0%, transparent 70%)' }} />

            {/* Flying Kiss Particles & Fairy Sparkles */}
            {Array.from({ length: 32 }).map((_, i) => {
              const randomX = (Math.random() - 0.5) * window.innerWidth * 0.95;
              const randomY = (Math.random() - 0.5) * window.innerHeight * 0.95;
              const delay = Math.random() * 0.7;
              const size = 32 + Math.random() * 40;

              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 1], 
                    opacity: [0, 1, 0.9, 0],
                    x: randomX,
                    y: randomY,
                    rotate: (Math.random() - 0.5) * 70
                  }}
                  transition={{ duration: 3.8, delay, ease: 'easeOut' }}
                  className="absolute pointer-events-none drop-shadow-[0_0_20px_rgba(255,100,150,0.9)] select-none"
                  style={{ fontSize: size }}
                >
                  {i % 4 === 0 ? '💋' : i % 4 === 1 ? '💖' : i % 4 === 2 ? '🌹' : '✨'}
                </motion.div>
              );
            })}

            {/* Center Storybook Fairytale Kiss Scroll */}
            <motion.div
              initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
              animate={{ 
                scale: [0.3, 1.12, 1], 
                rotate: [-15, 3, 0], 
                opacity: 1 
              }}
              transition={{ duration: 0.9, type: 'spring', bounce: 0.45 }}
              className="flex flex-col items-center text-center z-10 p-8 md:p-12 rounded-[3.5rem] bg-white/30 dark:bg-stone-900/60 backdrop-blur-lg border-2 border-white/60 shadow-[0_0_90px_rgba(255,102,133,0.6)] max-w-sm sm:max-w-md mx-4"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-400 to-pink-300 text-white flex items-center justify-center text-5xl mb-4 shadow-xl glow-rose animate-bounce">
                💋
              </div>
              <span className="font-fairytale text-4xl sm:text-5xl text-rose-300 lowercase mb-1">kiss from afar</span>
              <h2 className="text-3xl sm:text-4xl font-serif-italic font-bold text-white drop-shadow-md">
                A Giant Kiss for You!
              </h2>
              <p className="text-pink-100 text-sm sm:text-base font-medium mt-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
                Sent with all of {burst.sender}'s devotion
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin" />
              </p>
              <span className="text-white/70 text-[11px] mt-6 uppercase tracking-widest font-bold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
                Tap anywhere to close ✨
              </span>
            </motion.div>
          </div>
        )}

        {/* 2. HUG ANIMATION: WARM WRAPPING EMBRACE & GLOWING WINGS */}
        {burst.type === 'hug' && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Radial Warm Golden Peach Glow */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(255, 180, 100, 0.3) 0%, transparent 70%)' }} />

            {/* Orbiting Gentle Hearts & Arms */}
            {Array.from({ length: 28 }).map((_, i) => {
              const angle = (i / 28) * Math.PI * 2;
              const radius = 180 + (i % 3) * 80;

              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.3, 1], 
                    opacity: [0, 1, 0.8, 0],
                    x: [0, Math.cos(angle) * radius],
                    y: [0, Math.sin(angle) * radius],
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 4.2, delay: (i % 5) * 0.15, ease: 'easeOut' }}
                  className="absolute pointer-events-none text-3xl select-none drop-shadow-[0_0_15px_rgba(255,200,100,0.8)]"
                >
                  {i % 4 === 0 ? '🧸' : i % 4 === 1 ? '🫂' : i % 4 === 2 ? '🤍' : '✨'}
                </motion.div>
              );
            })}

            {/* Center Big Warm Hug Card */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.12, 1], opacity: 1 }}
              transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
              className="flex flex-col items-center text-center z-10 p-8 md:p-12 rounded-[3.5rem] bg-white/30 dark:bg-stone-900/60 backdrop-blur-lg border-2 border-white/60 shadow-[0_0_90px_rgba(255,180,120,0.6)] max-w-sm sm:max-w-md mx-4"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 text-white flex items-center justify-center text-5xl mb-4 shadow-xl glow-rose animate-pulse">
                🫂
              </div>
              <span className="font-fairytale text-4xl sm:text-5xl text-amber-200 lowercase mb-1">wrapped together</span>
              <h2 className="text-3xl sm:text-4xl font-serif-italic font-bold text-white drop-shadow-md">
                A Big Cozy Hug
              </h2>
              <p className="text-pink-100 text-sm sm:text-base font-medium mt-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-300 fill-pink-300 animate-ping" />
                {burst.sender} is holding you close right now
                <Heart className="w-4 h-4 text-pink-300 fill-pink-300 animate-ping" />
              </p>
              <span className="text-white/70 text-[11px] mt-6 uppercase tracking-widest font-bold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
                Tap anywhere to close ✨
              </span>
            </motion.div>
          </div>
        )}

        {/* 3. THINKING OF YOU / STARS: FAIRYTALE VINTAGE STARFALL */}
        {(burst.type === 'thinking' || burst.type === 'stars') && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Fairytale Twilight Glow */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(160, 100, 255, 0.3) 0%, transparent 70%)' }} />

            {/* Shimmering Falling Stars */}
            {Array.from({ length: 40 }).map((_, i) => {
              const startX = (Math.random() - 0.5) * window.innerWidth * 0.95;
              const startY = -window.innerHeight * 0.5;
              const endY = window.innerHeight * 0.6;
              const delay = Math.random() * 1.5;

              return (
                <motion.div
                  key={i}
                  initial={{ x: startX, y: startY, opacity: 0, scale: 0.2 }}
                  animate={{ 
                    y: endY, 
                    opacity: [0, 1, 0.9, 0],
                    scale: [0.2, 1.4, 0.7],
                    x: startX + (Math.random() - 0.5) * 120
                  }}
                  transition={{ duration: 3.8, delay, ease: 'easeInOut' }}
                  className="absolute pointer-events-none text-amber-200 text-2xl drop-shadow-[0_0_15px_gold] select-none"
                >
                  {i % 4 === 0 ? '✨' : i % 4 === 1 ? '🌟' : i % 4 === 2 ? '🌸' : '🤍'}
                </motion.div>
              );
            })}

            {/* Center Storybook Fairytale Star Scroll */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, type: 'spring' }}
              className="flex flex-col items-center text-center z-10 p-8 md:p-12 rounded-[3.5rem] bg-white/30 dark:bg-stone-900/60 backdrop-blur-lg border-2 border-white/60 shadow-[0_0_90px_rgba(200,160,255,0.6)] max-w-sm sm:max-w-md mx-4"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-400 to-pink-300 text-white flex items-center justify-center text-5xl mb-4 shadow-xl glow-rose">
                ✨
              </div>
              <span className="font-fairytale text-4xl sm:text-5xl text-amber-200 lowercase mb-1">starlit wishes</span>
              <h2 className="text-3xl sm:text-4xl font-serif-italic font-bold text-white drop-shadow-md">
                Thinking of You Always
              </h2>
              <p className="text-pink-100 text-sm sm:text-base font-medium mt-3">
                Every star in the night sky whispers how deeply {burst.sender} cares for you.
              </p>
              <span className="text-white/70 text-[11px] mt-6 uppercase tracking-widest font-bold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md">
                Tap anywhere to close ✨
              </span>
            </motion.div>
          </div>
        )}

      </motion.div>
    </AnimatePresence>
  );
}
