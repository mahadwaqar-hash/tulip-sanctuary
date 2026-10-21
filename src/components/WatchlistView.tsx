import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Film, 
  Tv, 
  Sparkles, 
  Search, 
  Plus, 
  Heart, 
  Star, 
  X, 
  Trash2, 
  Play, 
  CheckCircle2, 
  Loader2, 
  Filter, 
  ExternalLink, 
  RotateCw, 
  KeyRound, 
  ChevronRight,
  Flame,
  Clock,
  Check
} from 'lucide-react';
import { fb, useFirestore } from '../firebase';

const springBezier: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 22
};

export type MediaCategory = 'Watching' | 'Plan to Watch' | 'Finished';
export type MediaType = 'movie' | 'tv' | 'anime';

export interface SavedMedia {
  id: string;
  tmdbId?: number;
  title: string;
  mediaType: MediaType;
  posterUrl: string;
  overview: string;
  rating?: number;
  totalEpisodes?: number;
  watchedEpisodes: number;
  status: MediaCategory;
  addedBy: 'Mahad' | 'Ifa';
  releaseYear?: string;
  genres?: string[];
  notes?: string;
  createdAt: number;
}

export interface TmdbSearchResult {
  id: number;
  title: string;
  mediaType: MediaType;
  posterUrl: string;
  overview: string;
  rating?: number;
  releaseYear?: string;
  backdropUrl?: string;
}

// Preset posters for custom media additions
const PRESET_POSTERS = [
  { label: 'Fairytale Romance', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600' },
  { label: 'Anime Sunset', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600' },
  { label: 'Cinema Night', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=600' },
  { label: 'Starry Sky', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=600' }
];

export function getMediaTypeBadge(type: MediaType) {
  switch (type) {
    case 'anime':
      return {
        label: 'Anime 🌸',
        bg: 'bg-rose-950/80 dark:bg-rose-900/60',
        text: 'text-rose-200 dark:text-rose-300',
        border: 'border-rose-400/50',
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.45)]'
      };
    case 'tv':
      return {
        label: 'TV Series 📺',
        bg: 'bg-indigo-950/80 dark:bg-indigo-900/60',
        text: 'text-indigo-200 dark:text-indigo-300',
        border: 'border-indigo-400/50',
        glow: 'shadow-[0_0_12px_rgba(99,102,241,0.45)]'
      };
    case 'movie':
    default:
      return {
        label: 'Movie 🎬',
        bg: 'bg-teal-950/80 dark:bg-teal-900/60',
        text: 'text-teal-200 dark:text-teal-300',
        border: 'border-teal-400/50',
        glow: 'shadow-[0_0_12px_rgba(45,212,191,0.45)]'
      };
  }
}

const SHELVES_CONFIG: { id: MediaCategory; title: string; emoji: string; subtitle: string }[] = [
  {
    id: 'Watching',
    title: 'Currently Watching Together',
    emoji: '🍿',
    subtitle: 'Episodes & stories we enjoy side-by-side'
  },
  {
    id: 'Plan to Watch',
    title: 'Our Plan to Watch List',
    emoji: '⏳',
    subtitle: 'Adventures waiting for our next cozy movie night'
  },
  {
    id: 'Finished',
    title: 'Completed Masterpieces',
    emoji: '💖',
    subtitle: 'Stories that have made us laugh, cry, and fall in love'
  }
];

export default function WatchlistView({ currentUser }: { currentUser: 'Mahad' | 'Ifa' | null }) {
  // Sync with Firestore global settings
  const settingsArray = useFirestore<any>('userSettings', 'id', false) || [];
  const globalSettings = settingsArray.find(s => s.id === 'global') || {};

  // TMDB API Key state
  const [tmdbApiKey, setTmdbApiKey] = useState(() => {
    try {
      return localStorage.getItem('tulip_tmdb_api_key') || '';
    } catch (e) {
      return '';
    }
  });

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    const handleKeyUpdate = () => {
      try {
        const key = localStorage.getItem('tulip_tmdb_api_key') || '';
        setTmdbApiKey(key);
      } catch (e) {}
    };
    window.addEventListener('tmdb_key_updated', handleKeyUpdate);
    return () => window.removeEventListener('tmdb_key_updated', handleKeyUpdate);
  }, []);

  useEffect(() => {
    if (globalSettings.tmdbApiKey && !tmdbApiKey) {
      setTmdbApiKey(globalSettings.tmdbApiKey);
      try {
        localStorage.setItem('tulip_tmdb_api_key', globalSettings.tmdbApiKey);
      } catch (e) {}
    }
  }, [globalSettings.tmdbApiKey, tmdbApiKey]);

  // Saved Watchlist State - Strictly initialized to empty array (NO mock data)
  const [watchlist, setWatchlist] = useState<SavedMedia[]>(() => {
    try {
      const saved = localStorage.getItem('tulip_shared_watchlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // Save changes to localStorage & sync to Firestore
  const updateWatchlist = useCallback((newList: SavedMedia[]) => {
    setWatchlist(newList);
    try {
      localStorage.setItem('tulip_shared_watchlist', JSON.stringify(newList));
    } catch (e) {}
    fb.userSettings.set('global', { sharedWatchlist: newList }).catch(() => {});
  }, []);

  // Sync if Firestore has newer watchlist items
  useEffect(() => {
    if (Array.isArray(globalSettings.sharedWatchlist) && globalSettings.sharedWatchlist.length > 0) {
      const localCount = watchlist.length;
      const remoteCount = globalSettings.sharedWatchlist.length;
      if (localCount === 0 && remoteCount > 0) {
        setWatchlist(globalSettings.sharedWatchlist);
        try {
          localStorage.setItem('tulip_shared_watchlist', JSON.stringify(globalSettings.sharedWatchlist));
        } catch (e) {}
      }
    }
  }, [globalSettings.sharedWatchlist]);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TmdbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingMediaId, setAddingMediaId] = useState<number | null>(null);

  // View Filter states
  const [selectedShelf, setSelectedShelf] = useState<'All' | MediaCategory>('All');
  const [selectedOwner, setSelectedOwner] = useState<'All' | 'Mahad' | 'Ifa'>('All');
  const [selectedMediaType, setSelectedMediaType] = useState<'All' | MediaType>('All');

  // Interactive 3D Card Flip tracker: map of mediaId -> boolean
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Full Details Modal for reading complete overview & metadata
  const [selectedMedia, setSelectedMedia] = useState<SavedMedia | null>(null);
  const activeSelectedMedia = useMemo(() => {
    return selectedMedia ? watchlist.find(m => m.id === selectedMedia.id) || selectedMedia : null;
  }, [selectedMedia, watchlist]);

  // Custom Media Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customMediaType, setCustomMediaType] = useState<MediaType>('movie');
  const [customPosterUrl, setCustomPosterUrl] = useState('');
  const [customTotalEpisodes, setCustomTotalEpisodes] = useState<number | ''>(12);
  const [customOverview, setCustomOverview] = useState('');
  const [customStatus, setCustomStatus] = useState<MediaCategory>('Plan to Watch');

  // Debounced TMDB Multi-Search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performTmdbSearch = useCallback(async (query: string) => {
    const cleanQ = query.trim();
    if (!cleanQ) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const activeKey = tmdbApiKey || globalSettings.tmdbApiKey;
    if (!activeKey) {
      setSearchError('Please add your TMDB API Key in Settings to search movies & TV shows.');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const url = `https://api.themoviedb.org/3/search/multi?api_key=${activeKey}&query=${encodeURIComponent(cleanQ)}&include_adult=false`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid TMDB API Key. Please verify your key in Settings.');
        }
        throw new Error(`TMDB error (${res.status})`);
      }

      const data = await res.json();
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const filtered: TmdbSearchResult[] = rawResults
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => {
          const isJapanese = item.original_language === 'ja';
          const isAnimation = Array.isArray(item.genre_ids) && item.genre_ids.includes(16);
          
          let mediaType: MediaType = item.media_type === 'tv' ? 'tv' : 'movie';
          if (isJapanese && isAnimation) {
            mediaType = 'anime';
          }

          const posterUrl = item.poster_path 
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=400';

          const backdropUrl = item.backdrop_path 
            ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
            : undefined;

          return {
            id: item.id,
            title: item.title || item.name || 'Untitled',
            mediaType,
            posterUrl,
            backdropUrl,
            overview: item.overview || 'No description provided.',
            rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : undefined,
            releaseYear: (item.release_date || item.first_air_date || '').slice(0, 4)
          };
        });

      setSearchResults(filtered);
    } catch (err: any) {
      console.error('TMDB Search error:', err);
      setSearchError(err.message || 'Failed to search TMDB.');
    } finally {
      setIsSearching(false);
    }
  }, [tmdbApiKey, globalSettings.tmdbApiKey]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performTmdbSearch(val);
    }, 350);
  };

  // Add Item from TMDB Search to Watchlist
  const handleAddTmdbItem = async (item: TmdbSearchResult) => {
    setAddingMediaId(item.id);
    const activeKey = tmdbApiKey || globalSettings.tmdbApiKey;
    let resolvedEpisodes = item.mediaType === 'movie' ? 1 : 12;

    // Fetch TV details to get exact total episode count
    if (item.mediaType !== 'movie' && activeKey) {
      try {
        const detailRes = await fetch(`https://api.themoviedb.org/3/tv/${item.id}?api_key=${activeKey}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          if (detailData.number_of_episodes) {
            resolvedEpisodes = detailData.number_of_episodes;
          }
        }
      } catch (err) {
        console.warn('Could not fetch TV episode details:', err);
      }
    }

    const newMedia: SavedMedia = {
      id: `media-${Date.now()}-${item.id}`,
      tmdbId: item.id,
      title: item.title,
      mediaType: item.mediaType,
      posterUrl: item.posterUrl,
      overview: item.overview,
      rating: item.rating,
      totalEpisodes: resolvedEpisodes,
      watchedEpisodes: 0,
      status: 'Plan to Watch',
      addedBy: currentUser || 'Mahad',
      releaseYear: item.releaseYear,
      createdAt: Date.now()
    };

    updateWatchlist([newMedia, ...watchlist]);
    setAddingMediaId(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Add Custom Media
  const handleAddCustomMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const poster = customPosterUrl.trim() || PRESET_POSTERS[0].url;
    const episodes = customMediaType === 'movie' ? 1 : Number(customTotalEpisodes) || 12;

    const newMedia: SavedMedia = {
      id: `custom-media-${Date.now()}`,
      title: customTitle.trim(),
      mediaType: customMediaType,
      posterUrl: poster,
      overview: customOverview.trim() || 'Our personal favorite to watch together.',
      totalEpisodes: episodes,
      watchedEpisodes: 0,
      status: customStatus,
      addedBy: currentUser || 'Mahad',
      createdAt: Date.now()
    };

    updateWatchlist([newMedia, ...watchlist]);
    setShowCustomModal(false);
    setCustomTitle('');
    setCustomPosterUrl('');
    setCustomOverview('');
  };

  // Episode counter handlers
  const updateEpisodes = (id: string, delta: number) => {
    const nextList = watchlist.map(m => {
      if (m.id !== id) return m;
      const maxEpisodes = m.totalEpisodes || 9999;
      const nextWatched = Math.max(0, Math.min(maxEpisodes, m.watchedEpisodes + delta));
      let nextStatus = m.status;
      if (nextWatched >= maxEpisodes && maxEpisodes > 1) {
        nextStatus = 'Finished';
      } else if (nextWatched > 0 && nextStatus === 'Plan to Watch') {
        nextStatus = 'Watching';
      }
      return {
        ...m,
        watchedEpisodes: nextWatched,
        status: nextStatus
      };
    });
    updateWatchlist(nextList);
  };

  // Movie Watched toggle
  const toggleMovieWatched = (id: string) => {
    const nextList = watchlist.map(m => {
      if (m.id !== id) return m;
      const isFinished = m.status === 'Finished';
      return {
        ...m,
        status: (isFinished ? 'Plan to Watch' : 'Finished') as MediaCategory,
        watchedEpisodes: isFinished ? 0 : 1
      };
    });
    updateWatchlist(nextList);
  };

  // Move status shelf
  const updateMediaStatus = (id: string, newStatus: MediaCategory) => {
    const nextList = watchlist.map(m => {
      if (m.id !== id) return m;
      let nextWatched = m.watchedEpisodes;
      if (newStatus === 'Finished' && m.totalEpisodes) {
        nextWatched = m.totalEpisodes;
      } else if (newStatus === 'Plan to Watch') {
        nextWatched = 0;
      }
      return {
        ...m,
        status: newStatus,
        watchedEpisodes: nextWatched
      };
    });
    updateWatchlist(nextList);
  };

  // Delete item
  const handleDeleteMedia = (id: string) => {
    updateWatchlist(watchlist.filter(m => m.id !== id));
  };

  // Save TMDB API Key from in-view prompt
  const handleSaveApiKey = () => {
    const clean = apiKeyInput.trim();
    if (!clean) return;
    setTmdbApiKey(clean);
    try {
      localStorage.setItem('tulip_tmdb_api_key', clean);
    } catch (e) {}
    fb.userSettings.set('global', { tmdbApiKey: clean }).catch(() => {});
    window.dispatchEvent(new Event('tmdb_key_updated'));
    setShowApiKeyModal(false);
    if (searchQuery.trim()) {
      performTmdbSearch(searchQuery);
    }
  };

  // Filtered Media List
  const filteredMedia = useMemo(() => {
    return watchlist.filter(item => {
      if (selectedShelf !== 'All' && item.status !== selectedShelf) return false;
      if (selectedOwner !== 'All' && item.addedBy !== selectedOwner) return false;
      if (selectedMediaType !== 'All' && item.mediaType !== selectedMediaType) return false;
      return true;
    });
  }, [watchlist, selectedShelf, selectedOwner, selectedMediaType]);

  return (
    <div className="flex-1 w-full h-full flex flex-col overflow-y-auto no-scrollbar relative px-2 sm:px-6 pb-20 select-none">
      
      {/* HEADER SECTION */}
      <div className="w-full max-w-6xl mx-auto pt-2 sm:pt-4 mb-4 sm:mb-6">
        
        {/* Title & Floating Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-pastel-pink-400 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>Cozy Cinema Haven</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-serif-italic text-text-main flex items-center gap-2">
              <span>Our Shared Watchlist</span>
              <span className="text-xl sm:text-2xl not-italic">🎬🍿</span>
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Movies, anime, and series curated with love by Mahad & Ifa
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {!tmdbApiKey && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setApiKeyInput('');
                  setShowApiKeyModal(true);
                }}
                className="px-3.5 py-2 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs interactive-spring"
                title="Configure TMDB API Key"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Set TMDB Key</span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCustomModal(true)}
              className="px-4 py-2 rounded-full clay-btn text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md interactive-spring"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Media</span>
            </motion.button>
          </div>
        </div>

        {/* FLOATING CLAYMORPHIC SEARCH BAR */}
        <div className="relative w-full max-w-2xl mx-auto z-40">
          <div className="relative flex items-center w-full rounded-full bg-surface/90 border border-border/80 p-1.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_10px_25px_-5px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all focus-within:border-pastel-pink-400/80 focus-within:shadow-[0_0_20px_rgba(244,63,94,0.3)]">
            <div className="pl-3.5 pr-2 text-pastel-pink-400">
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search movies, anime, or series via TMDB..."
              className="flex-1 bg-transparent py-2 px-1 text-sm text-text-main placeholder:text-text-muted/70 outline-none font-medium"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1.5 mr-1 rounded-full text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* TMDB API KEY MISSING WARNING BANNER */}
          {!tmdbApiKey && searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-500 text-xs flex items-center justify-between gap-2"
            >
              <span>TMDB API Key needed to perform live search.</span>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="font-bold underline cursor-pointer hover:opacity-80"
              >
                Add Key Now
              </button>
            </motion.div>
          )}

          {/* TMDB SEARCH RESULTS DROPDOWN */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={springBezier}
                className="absolute top-full inset-x-0 mt-3 p-3 rounded-[28px] clay-card bg-surface/95 backdrop-blur-2xl border border-border shadow-2xl max-h-[420px] overflow-y-auto no-scrollbar z-50 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <span>TMDB Results ({searchResults.length})</span>
                  <button
                    onClick={() => setSearchResults([])}
                    className="hover:text-text-main cursor-pointer flex items-center gap-1"
                  >
                    <span>Close</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {searchResults.map((item) => {
                  const badge = getMediaTypeBadge(item.mediaType);
                  const isAdding = addingMediaId === item.id;
                  const alreadySaved = watchlist.some(m => m.tmdbId === item.id || m.title.toLowerCase() === item.title.toLowerCase());

                  return (
                    <div
                      key={item.id}
                      className="p-2 sm:p-2.5 rounded-2xl bg-surface-hover/80 hover:bg-surface-hover border border-border/50 flex items-center gap-3 transition-colors"
                    >
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-xl shadow-md shrink-0 border border-white/20"
                        loading="lazy"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border} ${badge.glow}`}>
                            {badge.label}
                          </span>
                          {item.releaseYear && (
                            <span className="text-[10px] text-text-muted font-bold">
                              {item.releaseYear}
                            </span>
                          )}
                          {item.rating && (
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {item.rating}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-text-main truncate mt-1">
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-text-muted line-clamp-2 sm:line-clamp-3 mt-0.5 leading-relaxed">
                          {item.overview}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {alreadySaved ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved</span>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isAdding}
                            onClick={() => handleAddTmdbItem(item)}
                            className="px-3.5 py-1.5 rounded-full clay-btn text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isAdding ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>Add</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* VIEW FILTERS (Shelf, Owner, Type) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-3 border-t border-border/40">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedShelf('All')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedShelf === 'All'
                  ? 'clay-btn text-white shadow-md'
                  : 'bg-surface/60 hover:bg-surface-hover text-text-muted hover:text-text-main border border-border/40'
              }`}
            >
              All Shelves
            </button>
            {SHELVES_CONFIG.map(shelf => (
              <button
                key={shelf.id}
                onClick={() => setSelectedShelf(shelf.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedShelf === shelf.id
                    ? 'clay-btn text-white shadow-md'
                    : 'bg-surface/60 hover:bg-surface-hover text-text-muted hover:text-text-main border border-border/40'
                }`}
              >
                <span>{shelf.emoji}</span>
                <span>{shelf.title.split(' ')[0]} {shelf.id === 'Watching' ? 'Watching' : shelf.id === 'Finished' ? 'Finished' : 'Plan'}</span>
              </button>
            ))}
          </div>

          {/* Owner & Media Type Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {/* Added By Filter */}
            <div className="flex items-center bg-surface/70 border border-border/60 rounded-full p-0.5">
              <button
                onClick={() => setSelectedOwner('All')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  selectedOwner === 'All'
                    ? 'bg-pastel-pink-400 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedOwner('Mahad')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedOwner === 'Mahad'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <span>Mahad 🌹</span>
              </button>
              <button
                onClick={() => setSelectedOwner('Ifa')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedOwner === 'Ifa'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <span>Ifa 🌷</span>
              </button>
            </div>

            {/* Media Type Filter */}
            <div className="flex items-center bg-surface/70 border border-border/60 rounded-full p-0.5">
              <button
                onClick={() => setSelectedMediaType('All')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMediaType === 'All'
                    ? 'bg-pastel-pink-400 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedMediaType('movie')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMediaType === 'movie'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setSelectedMediaType('tv')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMediaType === 'tv'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                TV
              </button>
              <button
                onClick={() => setSelectedMediaType('anime')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  selectedMediaType === 'anime'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Anime
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 3D CLAY SHELVES & MEDIA ITEMS */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* EMPTY STATE - STRICTLY Rendered when Watchlist is empty */}
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center clay-card rounded-[36px] bg-surface/70 border border-border/60 my-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pastel-pink-300 via-pastel-pink-400 to-amber-300" />
            
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-pastel-pink-200 to-pastel-pink-400 text-white flex items-center justify-center mb-5 shadow-lg glow-rose-sm"
            >
              <Film className="w-10 h-10 sm:w-12 sm:h-12 fill-white/80" />
            </motion.div>

            <span className="font-fairytale text-3xl sm:text-4xl text-pastel-pink-400 lowercase mb-1">
              our cozy theatre
            </span>
            <h3 className="text-xl sm:text-2xl font-bold font-serif-italic text-text-main mb-2">
              Your Watchlist is empty. Search to add some magic!
            </h3>
            <p className="text-xs sm:text-sm text-text-muted max-w-md mb-6 leading-relaxed">
              Find cute rom-coms, late night binge-worthy shows, and heartwarming anime using the TMDB search bar above or add custom home movies.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Search movies"]') as HTMLInputElement;
                  input?.focus();
                }}
                className="px-6 py-2.5 rounded-full clay-btn text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md interactive-spring"
              >
                <Search className="w-4 h-4" />
                <span>Search TMDB Now</span>
              </button>
              <button
                onClick={() => setShowCustomModal(true)}
                className="px-5 py-2.5 rounded-full bg-surface-hover hover:bg-surface text-text-main border border-border/80 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs interactive-spring"
              >
                <Plus className="w-4 h-4 text-pastel-pink-400" />
                <span>Add Custom Title</span>
              </button>
            </div>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center clay-card rounded-[32px] bg-surface/50 border border-border/50 my-6">
            <Film className="w-10 h-10 text-pastel-pink-400/60 mb-2" />
            <h4 className="text-base font-bold text-text-main">No media matches this filter</h4>
            <p className="text-xs text-text-muted mt-1">Try switching shelf or user filters above.</p>
          </div>
        ) : (
          SHELVES_CONFIG.map((shelf) => {
            const shelfItems = filteredMedia.filter(m => m.status === shelf.id);
            if (selectedShelf !== 'All' && selectedShelf !== shelf.id) return null;
            if (shelfItems.length === 0 && selectedShelf !== 'All') return null;

            return (
              <div key={shelf.id} className="flex flex-col w-full">
                
                {/* SHELF TITLE HEADER */}
                <div className="flex items-baseline justify-between mb-3 px-1">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold font-serif-italic text-text-main flex items-center gap-2">
                      <span>{shelf.emoji}</span>
                      <span>{shelf.title}</span>
                      <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted ml-1">
                        {shelfItems.length}
                      </span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-text-muted font-medium mt-0.5">
                      {shelf.subtitle}
                    </p>
                  </div>
                </div>

                {/* POSTERS ON THIS SHELF */}
                {shelfItems.length === 0 ? (
                  <div className="py-8 px-4 text-center rounded-2xl bg-surface/30 border border-dashed border-border/60 text-xs text-text-muted">
                    No shows on this shelf yet ✨ Search above to add one!
                  </div>
                ) : (
                  <div className="flex flex-wrap sm:flex-nowrap sm:overflow-x-auto sm:no-scrollbar gap-5 sm:gap-7 pt-10 sm:pt-12 pb-5 px-4 sm:px-6 items-end justify-start">
                    {shelfItems.map((item) => {
                      const isFlipped = !!flippedCards[item.id];
                      const badge = getMediaTypeBadge(item.mediaType);
                      const isFinished = item.status === 'Finished';
                      const progressPct = item.mediaType === 'movie' 
                        ? (isFinished ? 100 : 0)
                        : Math.min(100, Math.max(0, Math.round((item.watchedEpisodes / (item.totalEpisodes || 1)) * 100)));

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col items-center shrink-0 w-[145px] sm:w-[185px] group select-none"
                        >
                          {/* 3D FLIPPABLE POSTER CARD */}
                          <div className="relative [perspective:1000px] w-full h-[220px] sm:h-[275px]">
                            <div 
                              className="w-full h-full relative transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] [transform-style:preserve-3d] cursor-pointer"
                              style={{
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                              }}
                              onClick={() => toggleFlip(item.id)}
                            >
                              
                              {/* FRONT FACE OF POSTER */}
                              <div className="absolute inset-0 [backface-visibility:hidden] rounded-[22px] overflow-hidden border-t border-r border-white/25 shadow-[0_12px_24px_-6px_rgba(0,0,0,0.55)] clay-card bg-surface flex flex-col justify-between">
                                <img
                                  src={item.posterUrl}
                                  alt={item.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = PRESET_POSTERS[0].url;
                                  }}
                                />

                                {/* Top Badge Overlays */}
                                <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10 pointer-events-none">
                                  <span className={`text-[8.5px] sm:text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border} ${badge.glow}`}>
                                    {badge.label}
                                  </span>

                                  {item.rating && (
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-amber-300 text-[9px] font-bold shadow-xs">
                                      <Star className="w-2.5 h-2.5 fill-amber-300" />
                                      <span>{item.rating}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Bottom Dark Gradient with Title & Tap Hint */}
                                <div className="absolute inset-x-0 bottom-0 pt-10 pb-2.5 px-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-10 flex flex-col justify-end text-left pointer-events-none">
                                  <h4 className="text-white text-xs sm:text-sm font-bold font-serif-italic truncate drop-shadow-sm">
                                    {item.title}
                                  </h4>
                                  <div className="flex items-center justify-between gap-1 mt-0.5 text-[9px] sm:text-[10px] text-stone-300">
                                    <span>{item.releaseYear || 'Story'}</span>
                                    <span className="text-pastel-pink-300 flex items-center gap-0.5 font-sans font-bold">
                                      <RotateCw className="w-2.5 h-2.5" />
                                      <span>Flip</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* BACK FACE (CARD DETAILS & ACTIONS) */}
                              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[22px] p-3 sm:p-3.5 overflow-hidden clay-card bg-surface/95 border border-white/20 shadow-2xl flex flex-col justify-between text-left">
                                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                                  <div className="flex items-center justify-between gap-1 mb-1 border-b border-border/50 pb-1 shrink-0">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-pastel-pink-400">
                                      {item.mediaType} info
                                    </span>
                                    {item.rating && (
                                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                                        <Star className="w-3 h-3 fill-amber-400" />
                                        <span>{item.rating}/10</span>
                                      </span>
                                    )}
                                  </div>

                                  <h4 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMedia(item);
                                    }}
                                    className="text-xs sm:text-sm font-bold text-text-main line-clamp-1 font-serif-italic hover:text-pastel-pink-400 cursor-pointer shrink-0"
                                    title="Click to view full details"
                                  >
                                    {item.title}
                                  </h4>

                                  <div className="text-[10px] text-text-muted mt-0.5 font-medium shrink-0">
                                    {item.mediaType === 'movie' ? 'Feature Film' : `${item.totalEpisodes || '?'} Total Episodes`}
                                  </div>

                                  {/* Scrollable overview text that allows reading every sentence */}
                                  <div 
                                    className="flex-1 overflow-y-auto mt-1.5 pr-1 no-scrollbar select-text cursor-auto"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <p className="text-[10.5px] sm:text-[11.5px] text-text-muted/95 leading-relaxed font-sans">
                                      {item.overview || 'No synopsis available.'}
                                    </p>
                                  </div>

                                  {/* Quick Link to expand complete modal */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMedia(item);
                                    }}
                                    className="mt-1 text-[9.5px] sm:text-[10px] font-bold text-pastel-pink-400 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                                  >
                                    <span>Full synopsis & details ↗</span>
                                  </button>
                                </div>

                                {/* Status Switcher & Delete in Back Face */}
                                <div className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[9px] font-bold text-text-muted uppercase">Shelf:</span>
                                    <select
                                      value={item.status}
                                      onChange={(e) => updateMediaStatus(item.id, e.target.value as MediaCategory)}
                                      className="text-[10px] font-bold bg-surface-hover p-1 rounded-lg border border-border text-text-main outline-none cursor-pointer"
                                    >
                                      <option value="Watching">Watching</option>
                                      <option value="Plan to Watch">Plan to Watch</option>
                                      <option value="Finished">Finished</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center justify-between gap-1 pt-1">
                                    <button
                                      onClick={() => handleDeleteMedia(item.id)}
                                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                      title="Remove from watchlist"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Remove</span>
                                    </button>

                                    <button
                                      onClick={() => toggleFlip(item.id)}
                                      className="px-2 py-0.5 rounded-full bg-pastel-pink-400/20 text-pastel-pink-400 text-[10px] font-bold cursor-pointer"
                                    >
                                      Front ↺
                                    </button>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* FLOATING AVATAR BADGE (Top-Right Overlapping Clay Badge) */}
                            <div
                              className={`absolute -top-2.5 -right-2 sm:-top-3.5 sm:-right-2.5 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center select-none pointer-events-none border border-white/40 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1.5 group-hover:scale-110 ${
                                item.addedBy === 'Mahad'
                                  ? 'bg-gradient-to-br from-blue-400 via-indigo-600 to-blue-700 text-white'
                                  : 'bg-gradient-to-br from-pink-300 via-rose-400 to-rose-600 text-white'
                              }`}
                              style={{
                                boxShadow: item.addedBy === 'Mahad'
                                  ? 'inset 0 2px 3px rgba(255,255,255,0.4), 0 4px 8px -2px rgba(0,0,0,0.5), 0 0 10px rgba(59,130,246,0.4)'
                                  : 'inset 0 2px 3px rgba(255,255,255,0.4), 0 4px 8px -2px rgba(0,0,0,0.5), 0 0 10px rgba(244,63,94,0.4)',
                                transform: 'translateZ(30px)'
                              }}
                              title={`Added by ${item.addedBy}`}
                            >
                              <div className="flex items-center justify-center leading-none text-white drop-shadow-xs font-bold text-[9px] sm:text-[10.5px]">
                                <span>{item.addedBy === 'Mahad' ? 'M' : 'I'}</span>
                                <span className="ml-0.5">{item.addedBy === 'Mahad' ? '🌹' : '🌷'}</span>
                              </div>
                            </div>
                          </div>

                          {/* FLOATING PILL-SHAPED CLAY PROGRESS TRACKER */}
                          <div className="mt-2.5 w-full flex flex-col items-center">
                            {item.mediaType === 'movie' ? (
                              /* Glowing Mark as Watched Clay Toggle Button for Movies */
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleMovieWatched(item.id)}
                                className={`w-full py-2 px-3 rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer ${
                                  isFinished
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.45)]'
                                    : 'clay-btn text-white hover:opacity-95'
                                }`}
                              >
                                {isFinished ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 fill-white" />
                                    <span>Watched 💖</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 fill-white" />
                                    <span>Mark Watched</span>
                                  </>
                                )}
                              </motion.button>
                            ) : (
                              /* Squishy Neon Clay Buttons [-] {Watched}/{Total} [+] for TV & Anime */
                              <div className="w-full flex items-center justify-between gap-1 p-1 bg-surface/90 border border-border/70 rounded-full shadow-inner">
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateEpisodes(item.id, -1); }}
                                  className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-surface-hover hover:bg-rose-500/20 text-rose-400 font-black text-base flex items-center justify-center active:scale-90 transition-transform cursor-pointer border border-border shrink-0 select-none"
                                  title="Previous episode"
                                >
                                  -
                                </button>

                                <div className="flex flex-col items-center justify-center flex-1 min-w-0 px-1 select-none">
                                  <div className="flex items-baseline gap-0.5 sm:gap-1">
                                    <span className="font-extrabold text-xs sm:text-sm text-text-main font-mono">
                                      {item.watchedEpisodes}
                                    </span>
                                    <span className="text-[10px] text-text-muted">/</span>
                                    <span className="text-[11px] text-text-muted font-mono truncate max-w-[36px]">
                                      {item.totalEpisodes || '∞'}
                                    </span>
                                  </div>
                                  <span className="text-[8px] sm:text-[8.5px] font-bold text-pastel-pink-400 uppercase tracking-tighter">
                                    {isFinished ? 'Completed' : 'Episodes'}
                                  </span>
                                </div>

                                <button
                                  onClick={(e) => { e.stopPropagation(); updateEpisodes(item.id, 1); }}
                                  className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-pastel-pink-400 hover:bg-pastel-pink-300 text-white font-black text-base flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-md glow-rose-xs shrink-0 select-none"
                                  title="Next episode"
                                >
                                  +
                                </button>
                              </div>
                            )}

                            {/* Smooth Progress Bar at Bottom of Card */}
                            <div className="w-full h-1.5 mt-2 rounded-full bg-surface-hover overflow-hidden border border-border/40">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-pastel-pink-400 via-rose-400 to-amber-300 rounded-full"
                                initial={false}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                              />
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3D CLAY SHELF DIVIDER (Thick, rounded clay bar with deep drop shadow & bright top-inner highlight) */}
                <div className="relative w-full mt-3 mb-8 select-none pointer-events-none">
                  {/* Upper Surface / Clay Shelf Lip */}
                  <div 
                    className="h-4 sm:h-5 w-full rounded-full bg-gradient-to-r from-surface-hover via-surface to-surface-hover border-t border-white/35"
                    style={{
                      boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.2), 0 12px 20px -8px rgba(0,0,0,0.6)'
                    }}
                  />
                  {/* Deep Under-Shelf Shadow & Bottom Edge Bevel */}
                  <div className="h-2.5 sm:h-3 w-[98.5%] mx-auto -mt-1 rounded-b-2xl bg-gradient-to-b from-black/45 to-transparent" />
                </div>

              </div>
            );
          })
        )}

      </div>

      {/* CUSTOM MEDIA CREATION MODAL */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={springBezier}
              className="max-w-md w-full p-6 sm:p-7 rounded-[32px] clay-card bg-surface border border-border shadow-2xl flex flex-col relative max-h-[92dvh] overflow-y-auto no-scrollbar"
            >
              <button
                onClick={() => setShowCustomModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-pastel-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Plus className="w-4 h-4" />
                <span>Add Custom Title</span>
              </div>
              <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-4">
                Personal Movie or Series
              </h3>

              <form onSubmit={handleAddCustomMedia} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Our Istanbul Vacation Video / Your Name"
                    className="w-full bg-surface-hover p-3 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
                      Media Type
                    </label>
                    <select
                      value={customMediaType}
                      onChange={(e) => setCustomMediaType(e.target.value as MediaType)}
                      className="w-full bg-surface-hover p-3 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
                    >
                      <option value="movie">Movie 🎬</option>
                      <option value="tv">TV Series 📺</option>
                      <option value="anime">Anime 🌸</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
                      Initial Shelf
                    </label>
                    <select
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value as MediaCategory)}
                      className="w-full bg-surface-hover p-3 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
                    >
                      <option value="Watching">Watching</option>
                      <option value="Plan to Watch">Plan to Watch</option>
                      <option value="Finished">Finished</option>
                    </select>
                  </div>
                </div>

                {customMediaType !== 'movie' && (
                  <div>
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
                      Total Episodes
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={customTotalEpisodes}
                      onChange={(e) => setCustomTotalEpisodes(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 12 or 24"
                      className="w-full bg-surface-hover p-3 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
                    Poster Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={customPosterUrl}
                    onChange={(e) => setCustomPosterUrl(e.target.value)}
                    placeholder="https://... (or choose preset below)"
                    className="w-full bg-surface-hover p-3 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium"
                  />
                  
                  {/* Preset posters picker */}
                  <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar py-1">
                    {PRESET_POSTERS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomPosterUrl(p.url)}
                        className={`shrink-0 rounded-xl overflow-hidden border-2 transition-transform cursor-pointer ${
                          customPosterUrl === p.url ? 'border-pastel-pink-400 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p.url} alt={p.label} className="w-12 h-16 object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-main uppercase tracking-wider block mb-1">
                    Description / Personal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={customOverview}
                    onChange={(e) => setCustomOverview(e.target.value)}
                    placeholder="Why we love this or when to watch it..."
                    className="w-full bg-surface-hover p-3 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-medium resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-5 py-2.5 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full clay-btn text-white text-xs font-bold cursor-pointer shadow-md"
                  >
                    Add to Shelf
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TMDB API KEY MODAL */}
      <AnimatePresence>
        {showApiKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={springBezier}
              className="max-w-md w-full p-6 sm:p-7 rounded-[32px] clay-card bg-surface border border-border shadow-2xl flex flex-col relative"
            >
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-pastel-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
                <KeyRound className="w-4 h-4" />
                <span>TMDB Configuration</span>
              </div>
              <h3 className="text-2xl font-bold font-serif-italic text-text-main mb-2">
                Set TMDB API Key
              </h3>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">
                To search all movies, TV series, and anime with posters and ratings, paste your free TMDB API Key (v3 auth) below.
              </p>

              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-text-main uppercase tracking-wider block">
                      TMDB API Key (v3)
                    </label>
                    <a
                      href="https://www.themoviedb.org/settings/api"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-pastel-pink-400 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter 32-character key (e.g. 1a2b3c...)"
                    className="w-full bg-surface-hover p-3.5 rounded-2xl border border-border text-sm text-text-main outline-none focus:border-pastel-pink-400 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowApiKeyModal(false)}
                    className="px-5 py-2 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-6 py-2 rounded-full clay-btn text-white text-xs font-bold cursor-pointer shadow-md"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL MEDIA DETAILS & SYNOPSIS MODAL */}
      <AnimatePresence>
        {activeSelectedMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={springBezier}
              className="max-w-xl w-full p-5 sm:p-7 rounded-[32px] sm:rounded-[36px] clay-card bg-surface border border-border shadow-2xl flex flex-col relative max-h-[90dvh] overflow-y-auto no-scrollbar"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pastel-pink-300 via-pastel-pink-400 to-amber-300" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer hover:bg-surface-hover transition-colors"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header with Poster & Meta */}
              <div className="flex gap-4 sm:gap-6 items-start mt-2">
                <div className="w-24 sm:w-32 h-36 sm:h-48 rounded-2xl overflow-hidden shrink-0 border border-white/20 shadow-xl relative bg-black/20">
                  <img
                    src={activeSelectedMedia.posterUrl}
                    alt={activeSelectedMedia.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = PRESET_POSTERS[0].url;
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {(() => {
                      const b = getMediaTypeBadge(activeSelectedMedia.mediaType);
                      return (
                        <span className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full border ${b.bg} ${b.text} ${b.border} ${b.glow}`}>
                          {b.label}
                        </span>
                      );
                    })()}
                    {activeSelectedMedia.releaseYear && (
                      <span className="text-[10px] font-bold text-text-muted px-2 py-0.5 rounded-full bg-surface-hover border border-border">
                        {activeSelectedMedia.releaseYear}
                      </span>
                    )}
                    {activeSelectedMedia.rating && (
                      <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{activeSelectedMedia.rating} / 10</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-pastel-pink-400/15 border border-pastel-pink-400/30 text-pastel-pink-400 text-[10px] font-bold flex items-center gap-1">
                      <span>Brought by {activeSelectedMedia.addedBy}</span>
                      <span>{activeSelectedMedia.addedBy === 'Mahad' ? '🌹' : '🌷'}</span>
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold font-serif-italic text-text-main leading-tight">
                    {activeSelectedMedia.title}
                  </h3>

                  <div className="text-xs text-text-muted mt-1 font-medium">
                    {activeSelectedMedia.mediaType === 'movie' 
                      ? 'Feature Film' 
                      : `${activeSelectedMedia.totalEpisodes || '?'} Total Episodes`}
                  </div>

                  {/* Shelf Switcher in Modal */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-bold text-text-muted">Shelf:</span>
                    <select
                      value={activeSelectedMedia.status}
                      onChange={(e) => updateMediaStatus(activeSelectedMedia.id, e.target.value as MediaCategory)}
                      className="text-xs font-bold bg-surface-hover px-2.5 py-1 rounded-xl border border-border text-text-main outline-none cursor-pointer"
                    >
                      <option value="Watching">Currently Watching 🍿</option>
                      <option value="Plan to Watch">Plan to Watch ⏳</option>
                      <option value="Finished">Completed 💖</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Complete Synopsis Section - Fully readable without any cut-off */}
              <div className="mt-5 pt-4 border-t border-border/50 flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-pastel-pink-400 mb-2">
                  Full Story Synopsis
                </span>
                <div className="bg-surface-hover/60 border border-border/40 rounded-2xl p-4 max-h-[220px] overflow-y-auto no-scrollbar">
                  <p className="text-xs sm:text-sm text-text-main/90 leading-relaxed font-sans whitespace-pre-line select-text">
                    {activeSelectedMedia.overview || 'No full synopsis available for this title.'}
                  </p>
                </div>
              </div>

              {/* Episode Progress & Actions */}
              <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-auto flex-1">
                  {activeSelectedMedia.mediaType === 'movie' ? (
                    <button
                      onClick={() => toggleMovieWatched(activeSelectedMedia.id)}
                      className={`w-full py-2.5 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                        activeSelectedMedia.status === 'Finished'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                          : 'clay-btn text-white'
                      }`}
                    >
                      {activeSelectedMedia.status === 'Finished' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 fill-white" />
                          <span>Marked as Watched 💖</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Mark as Watched</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-muted">Progress:</span>
                      <div className="flex items-center gap-1.5 p-1 bg-surface-hover rounded-full border border-border">
                        <button
                          onClick={() => updateEpisodes(activeSelectedMedia.id, -1)}
                          className="w-8 h-8 rounded-full bg-surface hover:bg-rose-500/20 text-rose-400 font-black text-sm flex items-center justify-center active:scale-90 transition-transform cursor-pointer border border-border select-none"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-text-main">
                          {activeSelectedMedia.watchedEpisodes} / {activeSelectedMedia.totalEpisodes || '∞'}
                        </span>
                        <button
                          onClick={() => updateEpisodes(activeSelectedMedia.id, 1)}
                          className="w-8 h-8 rounded-full bg-pastel-pink-400 hover:bg-pastel-pink-300 text-white font-black text-sm flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-xs select-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      handleDeleteMedia(activeSelectedMedia.id);
                      setSelectedMedia(null);
                    }}
                    className="px-4 py-2 rounded-full text-rose-400 hover:bg-rose-500/15 border border-rose-400/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from shelf</span>
                  </button>

                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="px-5 py-2 rounded-full clay-btn text-white text-xs font-bold cursor-pointer shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}