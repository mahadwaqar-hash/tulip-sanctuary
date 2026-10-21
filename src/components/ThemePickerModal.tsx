import { motion } from 'framer-motion';
import { X, Check, Sparkles, Palette } from 'lucide-react';
import { fb } from '../firebase';

export interface SanctuaryTheme {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  isDark: boolean;
  bgGrad: string;
  accent: string;
  cardBg: string;
}

export const SANCTUARY_THEMES: SanctuaryTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight Velvet',
    subtitle: 'OLED Obsidian & Neon Rose',
    emoji: '🌙',
    isDark: true,
    bgGrad: 'from-[#0A0A0A] to-[#15151A]',
    accent: '#FF1493',
    cardBg: '#111116'
  },
  {
    id: 'tulip',
    name: 'Pastel Tulip',
    subtitle: 'Blossom Pink & Lavender Blush',
    emoji: '🌷',
    isDark: false,
    bgGrad: 'from-[#FFF0F5] to-[#FFE4E1]',
    accent: '#FF1493',
    cardBg: '#FFF0F5'
  },
  {
    id: 'sunset',
    name: 'Sunset Romance',
    subtitle: 'Warm Coral, Amber & Rose Gold',
    emoji: '🌅',
    isDark: true,
    bgGrad: 'from-[#180D12] to-[#27141C]',
    accent: '#E75438',
    cardBg: '#231219'
  },
  {
    id: 'lavender',
    name: 'Lilac Fairytale',
    subtitle: 'Starlight Violet & Dreamy Amethyst',
    emoji: '✨',
    isDark: true,
    bgGrad: 'from-[#110B1C] to-[#1B122C]',
    accent: '#9B51E0',
    cardBg: '#191029'
  },
  {
    id: 'emerald',
    name: 'Enchanted Forest',
    subtitle: 'Botanical Sage & Romantic Emerald',
    emoji: '🌿',
    isDark: true,
    bgGrad: 'from-[#07120D] to-[#0D2017]',
    accent: '#10B981',
    cardBg: '#0C1E16'
  },
  {
    id: 'celestial',
    name: 'Midnight Starlight',
    subtitle: 'Deep Sapphire Sky & Silver Stardust',
    emoji: '🌌',
    isDark: true,
    bgGrad: 'from-[#060B18] to-[#0C152B]',
    accent: '#3B82F6',
    cardBg: '#0B1730'
  },
  {
    id: 'matcha',
    name: 'Matcha Latte',
    subtitle: 'Fresh Pistachio, Cream & Calm Green',
    emoji: '🍵',
    isDark: false,
    bgGrad: 'from-[#F5F9F3] to-[#E9F3E6]',
    accent: '#5E935A',
    cardBg: '#F5F9F3'
  },
  {
    id: 'peach',
    name: 'Peachy Cream',
    subtitle: 'Soft Apricot & Warm Vanilla Glow',
    emoji: '🍑',
    isDark: false,
    bgGrad: 'from-[#FFF8F3] to-[#FEEFE4]',
    accent: '#F97316',
    cardBg: '#FFF8F3'
  }
];

export function applySanctuaryTheme(themeId: string) {
  const selected = SANCTUARY_THEMES.find(t => t.id === themeId) || SANCTUARY_THEMES[0];
  document.documentElement.setAttribute('data-theme', selected.id);
  if (selected.isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('tulip_theme_id', selected.id);
  localStorage.setItem('tulip_theme', selected.isDark ? 'dark' : 'light');
  window.dispatchEvent(new Event('theme_changed'));
}

interface ThemePickerModalProps {
  currentThemeId: string;
  onSelectTheme: (id: string) => void;
  onClose: () => void;
}

export default function ThemePickerModal({ currentThemeId, onSelectTheme, onClose }: ThemePickerModalProps) {
  const handleSelect = async (theme: SanctuaryTheme) => {
    onSelectTheme(theme.id);
    applySanctuaryTheme(theme.id);
    try {
      await fb.userSettings.set('global', { sanctuaryTheme: theme.id });
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 15 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22, mass: 0.8 }}
        className="w-full max-w-lg rounded-[36px] p-6 md:p-8 clay-card border border-border flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pastel-pink-400 text-white flex items-center justify-center shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
                Sanctuary Themes <Sparkles className="w-4 h-4 text-pastel-pink-400" />
              </h3>
              <p className="text-xs text-text-muted">
                Choose the romantic aesthetic for your shared haven
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {SANCTUARY_THEMES.map((theme) => {
            const isSelected = currentThemeId === theme.id;
            return (
              <motion.div
                key={theme.id}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => handleSelect(theme)}
                className={`p-4 rounded-[28px] border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden shadow-[0_8px_20px_-6px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_6px_rgba(0,0,0,0.1)] ${
                  isSelected
                    ? 'border-pastel-pink-400 ring-4 ring-pastel-pink-400/25 shadow-[0_12px_28px_-4px_var(--accent-glow)] scale-[1.02]'
                    : theme.isDark
                      ? 'border-border/60 hover:border-pastel-pink-400/50'
                      : 'border-slate-300/80 hover:border-pastel-pink-400/60'
                }`}
                style={{ backgroundColor: theme.cardBg }}
              >
                {/* Visual Preview Banner */}
                <div className={`h-12 w-full rounded-2xl bg-gradient-to-r ${theme.bgGrad} p-2 flex items-center justify-between mb-3 border border-black/10 dark:border-white/10 shadow-inner`}>
                  <span className="text-xl">{theme.emoji}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-white/30 shadow-xs" style={{ backgroundColor: theme.accent }} />
                    <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: theme.isDark ? '#FFFFFF' : '#333333' }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-extrabold text-sm font-serif-italic flex items-center gap-1.5 ${theme.isDark ? 'text-white' : 'text-slate-900 font-extrabold'}`}>
                      <span>{theme.name}</span>
                      <span className="text-xs">{theme.emoji}</span>
                    </h4>
                    <p className={`text-[11px] mt-0.5 font-bold leading-tight ${theme.isDark ? 'text-white/70' : 'text-slate-700'}`}>
                      {theme.subtitle}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-pastel-pink-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">
            Themes sync live across all your screens ✨
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full clay-btn text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
