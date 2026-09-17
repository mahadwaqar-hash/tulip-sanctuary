import { useState, useEffect } from 'react';
import { FileText, Heart, Sparkles, Check } from 'lucide-react';
import { useFirestore, fb } from '../firebase';

interface ScratchpadViewProps {
  currentUser: 'Mahad' | 'Ifa';
}

export default function ScratchpadView({ currentUser }: ScratchpadViewProps) {
  const scratchpads = useFirestore<any>('scratchpad', 'updatedAt', true);
  const scratchpad = scratchpads.find((s) => s.id === 'shared-pad');
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);

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
    <div className="flex-1 flex flex-col h-full rounded-[2.5rem] glass-panel shadow-2xl overflow-hidden border border-border">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border bg-surface/80 backdrop-blur-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
              <span>Secret Love Notes & Scratchpad</span>
              <Sparkles className="w-4 h-4 text-pastel-pink-400" />
            </h2>
            <p className="text-xs text-text-muted font-medium">
              Synchronized notepad for letters, bucket lists, and sweet whispers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          {isSaved ? (
            <span className="text-emerald-500 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          ) : (
            <span className="opacity-70">Auto-saved live</span>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-8 md:p-12 overflow-y-auto relative flex flex-col">
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write to each other here..."
          className="flex-1 w-full bg-transparent resize-none outline-none text-text-main text-lg md:text-xl font-medium leading-relaxed placeholder:text-text-muted/40 font-sans"
          style={{ lineHeight: 1.8 }}
        />

        <div className="pt-4 border-t border-border/40 flex justify-between items-center text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pastel-pink-400 fill-pastel-pink-400" />
            Active editor: <strong className="text-text-main">{currentUser}</strong>
          </span>
          <span>Markdown supported</span>
        </div>
      </div>
    </div>
  );
}
