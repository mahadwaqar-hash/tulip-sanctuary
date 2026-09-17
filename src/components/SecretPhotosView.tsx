import { useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Camera, 
  Heart, 
  MapPin, 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus,
  Lock,
  Unlock,
  KeyRound,
  Download
} from 'lucide-react';
import { useFirestore, fb } from '../firebase';
import type { VaultPhoto } from '../db';

const springConfig: Transition = { type: 'spring', stiffness: 400, damping: 26 };

interface SecretPhotosViewProps {
  currentUser: 'Mahad' | 'Ifa';
  sanctuaryPassword?: string;
}

export default function SecretPhotosView({ currentUser, sanctuaryPassword }: SecretPhotosViewProps) {
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('Lahore, PK');
  const [selectedPhoto, setSelectedPhoto] = useState<VaultPhoto | null>(null);
  const [tempDataUrl, setTempDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photos = useFirestore<VaultPhoto>('vaultPhotos', 'createdAt', true);

  const handleDownload = (dataUrl: string, caption: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = (caption.trim() || 'tulip_memory').replace(/[^a-z0-9]/gi, '_') + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUnlockPhotos = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passInput.trim().toLowerCase();
    const targetPass = (sanctuaryPassword || localStorage.getItem('tulip_custom_sanctuary_pass') || '311212').trim().toLowerCase();

    if (clean === targetPass) {
      if ('vibrate' in navigator) navigator.vibrate([40, 40]);
      setIsUnlocked(true);
      setPassError(false);
    } else {
      setPassError(true);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    }
  };

  const handleLockPhotos = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('tulip_photos_unlocked');
    setPassInput('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setTempDataUrl(ev.target.result as string);
        setShowUploadModal(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDataUrl) return;

    if ('vibrate' in navigator) navigator.vibrate(50);

    await fb.vaultPhotos.add({
      id: crypto.randomUUID(),
      dataUrl: tempDataUrl,
      caption: caption.trim() || 'A sweet memory with you',
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      location: location.trim(),
      addedBy: currentUser,
      createdAt: Date.now()
    });

    setTempDataUrl(null);
    setCaption('');
    setShowUploadModal(false);
  };

  const handleDeletePhoto = async (id: string) => {
    await fb.vaultPhotos.delete(id);
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full md:rounded-[2.5rem] md:glass-panel shadow-2xl overflow-hidden md:border border-border relative">
      
      {/* 1. PHOTO VAULT PASSWORD BARRIER */}
      {!isUnlocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-surface-hover/20 backdrop-blur-md z-10 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm p-8 rounded-[2.5rem] glass-panel shadow-2xl flex flex-col items-center text-center border border-border"
          >
            <div className="w-16 h-16 rounded-full bg-surface-hover border border-border flex items-center justify-center mb-6 shadow-inner relative">
              <Lock className="w-7 h-7 text-pastel-pink-400 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-pastel-pink-400/30 animate-[ping_3s_ease-in-out_infinite]" />
            </div>

            <h2 className="text-2xl font-bold font-serif-italic text-text-main">Secret Scrapbook</h2>
            <p className="text-[11px] text-text-muted mt-2 font-medium mb-8">
              A private vault for our eyes only. Enter sanctuary password to view.
            </p>

            <form onSubmit={handleUnlockPhotos} className="w-full flex flex-col gap-4">
              <input
                type="password"
                placeholder="Sanctuary password..."
                value={passInput}
                onChange={(e) => {
                  setPassInput(e.target.value);
                  setPassError(false);
                }}
                className={`w-full bg-surface py-3.5 px-6 rounded-full border text-center text-sm font-medium outline-none transition-all ${
                  passError 
                    ? 'border-red-500 text-red-500 animate-[shake_0.4s_ease-in-out]' 
                    : 'border-border text-text-main focus:border-pastel-pink-400'
                }`}
                autoFocus
              />

              <style>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  25% { transform: translateX(-8px); }
                  75% { transform: translateX(8px); }
                }
              `}</style>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="w-full py-3.5 rounded-full text-white font-bold text-xs uppercase tracking-widest shadow-md transition-colors bg-pastel-pink-400 hover:bg-pastel-pink-300 cursor-pointer"
              >
                Unlock Pictures
              </motion.button>
            </form>
          </motion.div>
        </div>
      ) : (
        /* 2. UNLOCKED SCRAPBOOK GALLERY */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* HEADER */}
          <div className="px-8 py-5 border-b border-border bg-surface/80 backdrop-blur-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
                  <span>Our Secret Scrapbook</span>
                  <Heart className="w-4 h-4 text-pastel-pink-400 fill-pastel-pink-400" />
                </h2>
                <p className="text-xs text-text-muted font-medium">
                  Private polaroids reserved just for us.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full bg-pastel-pink-400 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Memory
              </motion.button>

              <button
                onClick={handleLockPhotos}
                className="p-2.5 rounded-full border border-border text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                title="Lock Photo Vault"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* POLAROID / SCRAPBOOK GRID */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: i % 2 === 0 ? 1 : -1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.03, rotate: 0, y: -4 }}
                  transition={springConfig}
                  onClick={() => setSelectedPhoto(photo)}
                  className="p-3 bg-white dark:bg-surface rounded-2xl border border-border shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col group relative"
                >
                  <div className="w-16 h-3 bg-pastel-pink-200/60 dark:bg-pastel-pink-400/30 rounded-sm mx-auto -mt-4 mb-2 shadow-xs rotate-1" />

                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-surface-hover mb-3 relative group/img">
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => handleDownload(photo.dataUrl, photo.caption, e)}
                      className="absolute bottom-2 right-2 p-2 rounded-full bg-white/80 dark:bg-charcoal/80 text-text-main shadow-md hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Download Photo"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="px-1 flex flex-col">
                    <p className="text-sm font-serif-italic font-bold text-text-main line-clamp-2 leading-tight">
                      "{photo.caption}"
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-text-muted mt-2 pt-2 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-pastel-pink-400" /> {photo.date}
                      </span>
                      {photo.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-pastel-pink-400" /> {photo.location}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {photos.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-muted">
                  <div className="w-16 h-16 rounded-full bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center mb-4 animate-bounce">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif-italic text-2xl text-text-main">No Scrapbook Photos Yet</h3>
                  <p className="text-xs text-text-muted mt-1 font-medium">Click "+ Add Memory" to pin your first sweet photo!</p>
                </div>
              )}
            </div>
          </div>

          {/* UPLOAD CAPTION MODAL */}
          <AnimatePresence>
            {showUploadModal && tempDataUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={springConfig}
                  className="bg-surface glass-panel p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl border border-border flex flex-col"
                >
                  <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-4">Add Sweet Memory</h3>

                  <div className="w-full aspect-video rounded-2xl overflow-hidden bg-surface-hover mb-4 shadow-sm">
                    <img src={tempDataUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>

                  <form onSubmit={handleSavePhoto} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Caption (e.g. You looking cute at dinner...)"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400"
                      required
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Location (e.g. Lahore / Paris)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400"
                    />

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setTempDataUrl(null);
                          setShowUploadModal(false);
                        }}
                        className="px-5 py-2.5 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors cursor-pointer"
                      >
                        Pin Memory 💕
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* LIGHTBOX */}
          <AnimatePresence>
            {selectedPhoto && (
              <div
                onClick={() => setSelectedPhoto(null)}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-pointer"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={springConfig}
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-3xl w-full rounded-[2.5rem] overflow-hidden glass-panel border border-white/20 shadow-2xl flex flex-col"
                >
                  <div className="p-3 bg-black/40 flex justify-center max-h-[70vh] overflow-hidden">
                    <img src={selectedPhoto.dataUrl} alt={selectedPhoto.caption} className="max-h-[68vh] object-contain rounded-2xl" />
                  </div>

                  <div className="p-6 bg-surface/90 backdrop-blur-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold font-serif-italic text-text-main">"{selectedPhoto.caption}"</h4>
                      <div className="flex items-center gap-4 text-xs text-text-muted mt-1 font-medium">
                        <span>Pinned by {selectedPhoto.addedBy}</span>
                        <span>• {selectedPhoto.date}</span>
                        {selectedPhoto.location && <span>• {selectedPhoto.location}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(selectedPhoto.dataUrl, selectedPhoto.caption)}
                        className="px-4 py-2.5 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Download High-Res Original"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>

                      <button
                        onClick={() => handleDeletePhoto(selectedPhoto.id)}
                        className="p-2.5 rounded-full bg-surface-hover hover:bg-red-400 hover:text-white text-text-muted transition-colors cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
