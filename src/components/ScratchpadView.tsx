import { useState, useEffect } from 'react';
import { FileText, Heart, Sparkles, Check, Edit2, BookOpen } from 'lucide-react';
import { useFirestore, fb } from '../firebase';
import ReactMarkdown from 'react-markdown';

interface ScratchpadViewProps {
  currentUser: 'Mahad' | 'Ifa';
}

export default function ScratchpadView({ currentUser }: ScratchpadViewProps) {
  const scratchpads = useFirestore<any>('scratchpad', 'updatedAt', true);
  const scratchpad = scratchpads.find((s) => s.id === 'shared-pad');
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [mode, setMode] = useState<'write' | 'read'>('write');

  useEffect(() => {
    if (scratchpad) {
      setContent(scratchpad.content);
    } else {
      const initial = `# Our Secret Notebook 🌸\n\n- [ ] Midnight movie date\n- [ ] Try that new gelato spot\n- [ ] Trip to the mountains together\n\nLeave little letters, bucket list dreams, and cute thoughts here anytime... 💕`;
      fb.scratchpad.add({
        id: 'shared-pad',
        content: initial,
        updatedAt: Date.now()
      });
      setContent(initial);
    }
  }, [scratchpad?.content]);

  const handleChange = async (newVal: string) => {
    setContent(newVal);
    setIsSaved(true);
    await fb.scratchpad.add({
      id: 'shared-pad',
      content: newVal,
      updatedAt: Date.now()
    });
    setTimeout(() => setIsSaved(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full rounded-[2.5rem] glass-panel shadow-2xl overflow-hidden border border-border relative">
      {/* SVG Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
      
      {/* Header */}
      <div className="px-8 py-5 border-b border-border bg-surface/80 backdrop-blur-2xl flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
              <span>Secret Love Notes & Scratchpad</span>
              <Sparkles className="w-4 h-4 text-pastel-pink-400" />
            </h2>
            <div className="flex items-center gap-3">
              <p className="text-xs text-text-muted font-medium">
                Synchronized notepad for letters, bucket lists, and sweet whispers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            {isSaved ? (
              <span className="text-emerald-500 flex items-center gap-1 animate-pulse">
                <Check className="w-3.5 h-3.5" /> Saved live ✨
              </span>
            ) : (
              <span className="opacity-70">Auto-saved live</span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-surface-hover rounded-xl p-1 border border-border/50">
            <button
              onClick={() => setMode('write')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${mode === 'write' ? 'bg-pastel-pink-400 text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => setMode('read')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${mode === 'read' ? 'bg-pastel-pink-400 text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
            >
              <BookOpen className="w-3 h-3" /> Read
            </button>
          </div>
        </div>
      </div>

      {/* Editor / Reader Area */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto relative flex flex-col z-10">
        {mode === 'write' ? (
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write to each other here..."
            className="flex-1 w-full bg-transparent resize-none outline-none text-text-main text-lg font-medium leading-relaxed placeholder:text-text-muted/40 font-serif-italic"
            style={{ lineHeight: 1.8 }}
          />
        ) : (
          <div className="flex-1 prose prose-pink dark:prose-invert max-w-none text-lg font-serif-italic font-medium text-text-main" style={{ lineHeight: 1.8 }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        <div className="pt-4 mt-auto border-t border-border/40 flex justify-between items-center text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pastel-pink-400 fill-pastel-pink-400" />
            Active viewer: <strong className="text-text-main">{currentUser}</strong>
          </span>
          <span>Markdown Supported ✨</span>
        </div>
      </div>
    </div>
  );
}
