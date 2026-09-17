import { motion } from 'framer-motion';

const FLOATING_ELEMENTS = [
  { id: 1, symbol: '🌸', left: '8%', delay: 0, duration: 18, size: 'text-xl' },
  { id: 2, symbol: '✨', left: '22%', delay: 3, duration: 14, size: 'text-sm' },
  { id: 3, symbol: '🌷', left: '35%', delay: 6, duration: 20, size: 'text-lg' },
  { id: 4, symbol: '💖', left: '48%', delay: 1, duration: 16, size: 'text-base' },
  { id: 5, symbol: '🫧', left: '62%', delay: 4, duration: 22, size: 'text-xl' },
  { id: 6, symbol: '🎀', left: '76%', delay: 8, duration: 17, size: 'text-sm' },
  { id: 7, symbol: '💕', left: '88%', delay: 2, duration: 19, size: 'text-base' },
  { id: 8, symbol: '✨', left: '94%', delay: 5, duration: 13, size: 'text-xs' },
];

export default function AmbientFairytaleDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-45 dark:opacity-20">
      {/* Gentle floating ambient elements */}
      {FLOATING_ELEMENTS.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute bottom-[-50px] ${item.size}`}
          style={{ left: item.left }}
          animate={{
            y: ['0vh', '-115vh'],
            x: ['0px', '25px', '-20px', '15px', '0px'],
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

      {/* Subtle Fairy Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-pastel-pink-200/30 dark:bg-pastel-pink-400/10 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 -right-20 w-96 h-96 rounded-full bg-pastel-peach/30 dark:bg-pastel-lavender/10 blur-3xl pointer-events-none" />
    </div>
  );
}
