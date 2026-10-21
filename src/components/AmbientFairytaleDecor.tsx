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
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Slow-Animating Radial Aurora Mesh Glow Layer (Theme Synced, 10-15% Opacity with Heavy Blur) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary Glow Orb */}
        <motion.div
          className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full blur-[130px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--bubble-me-from, var(--pink-300)) 0%, transparent 70%)',
            opacity: 0.14,
            willChange: 'transform',
          }}
          animate={{
            x: [0, 45, -25, 0],
            y: [0, -35, 25, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Accent Glow Orb */}
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--bubble-me-to, var(--pink-400)) 0%, transparent 70%)',
            opacity: 0.13,
            willChange: 'transform',
          }}
          animate={{
            x: [0, -45, 30, 0],
            y: [0, 35, -20, 0],
            scale: [1, 1.18, 0.92, 1],
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* Center-Top Ambient Aura */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full blur-[150px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--pink-200, var(--peach)) 0%, transparent 70%)',
            opacity: 0.10,
            willChange: 'transform',
          }}
          animate={{
            scale: [0.92, 1.12, 0.92],
            opacity: [0.08, 0.14, 0.08],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />
      </div>

      {/* 2. Radial Dark Edge Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.22)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.5)_100%)]" />

      {/* 3. SVG Film Grain Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035] mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
        <filter id="fairytale-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#fairytale-grain)" />
      </svg>

      {/* 4. Gentle floating ambient fairytale elements */}
      <div className="absolute inset-0 pointer-events-none opacity-45 dark:opacity-25">
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
      </div>
    </div>
  );
}
