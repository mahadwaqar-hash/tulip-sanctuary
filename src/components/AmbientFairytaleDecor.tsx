import { motion } from 'framer-motion';

const FLOATING_ELEMENTS = [
  { id: 1, symbol: '🌸', left: '10%', delay: 0, duration: 20, size: 'text-xl' },
  { id: 2, symbol: '✨', left: '25%', delay: 3, duration: 16, size: 'text-sm' },
  { id: 3, symbol: '🌷', left: '50%', delay: 7, duration: 22, size: 'text-lg' },
  { id: 4, symbol: '💖', left: '70%', delay: 2, duration: 18, size: 'text-base' },
  { id: 5, symbol: '🫧', left: '85%', delay: 5, duration: 24, size: 'text-xl' },
  { id: 6, symbol: '✨', left: '95%', delay: 8, duration: 15, size: 'text-xs' },
];

export default function AmbientFairytaleDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-45 dark:opacity-20">
      {/* Gentle floating ambient elements */}
      {FLOATING_ELEMENTS.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute bottom-[-50px] ${item.size}`}
          style={{ left: item.left, willChange: 'transform, opacity' }}
          animate={{
            y: ['0vh', '-115vh'],
            x: ['0px', '20px', '-15px', '10px', '0px'],
            rotate: [0, 45, -30, 60, 0],
            opacity: [0, 0.8, 0.9, 0.7, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: 'linear',
          }}
        >
          {item.symbol}
        </motion.div>
      ))}

      {/* Subtle Fairy Glow Orbs - Removed animate-pulse for performance */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-pastel-pink-200/30 dark:bg-pastel-pink-400/10 blur-3xl pointer-events-none will-change-transform" />
      <div className="absolute bottom-1/3 -right-20 w-96 h-96 rounded-full bg-pastel-peach/30 dark:bg-pastel-lavender/10 blur-3xl pointer-events-none will-change-transform" />
    </div>
  );
}
