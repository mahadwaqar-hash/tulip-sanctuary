import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Sparkles, 
  Heart, 
  Bookmark, 
  Star, 
  X, 
  Trash2, 
  ExternalLink, 
  Check, 
  Loader2, 
  Filter, 
  BookMarked
} from 'lucide-react';

const springBezier: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 20
};

export type ShelfCategory = 'reading' | 'favorites' | 'wishlist';

export interface SavedBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  genre: string;
  genres?: string[];
  shelf: ShelfCategory;
  rating?: number;
  addedBy: 'Mahad' | 'Ifa';
  notes?: string;
  year?: string;
}

export interface SearchResultBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  genre: string;
  genres?: string[];
  year?: string;
}

export function getGenreBadgeStyle(genreName: string) {
  const g = (genreName || '').toLowerCase();
  
  if (g.includes('romance') || g.includes('love') || g.includes('dating') || g.includes('heart') || g.includes('romantasy')) {
    return {
      bg: 'bg-rose-950/80 dark:bg-rose-900/60',
      text: 'text-rose-200 dark:text-rose-300',
      border: 'border-rose-400/50',
      glow: 'shadow-[0_0_14px_rgba(244,63,94,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
    };
  }
  if (g.includes('fantasy') || g.includes('magic') || g.includes('myth') || g.includes('fae') || g.includes('witch') || g.includes('supernatural') || g.includes('gothic')) {
    return {
      bg: 'bg-purple-950/80 dark:bg-purple-900/60',
      text: 'text-purple-200 dark:text-purple-300',
      border: 'border-purple-400/50',
      glow: 'shadow-[0_0_14px_rgba(168,85,247,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
    };
  }
  if (g.includes('sci-fi') || g.includes('science fiction') || g.includes('space') || g.includes('time travel') || g.includes('cyber') || g.includes('dystop') || g.includes('futur')) {
    return {
      bg: 'bg-teal-950/80 dark:bg-teal-900/60',
      text: 'text-teal-200 dark:text-teal-300',
      border: 'border-teal-400/50',
      glow: 'shadow-[0_0_14px_rgba(45,212,191,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
    };
  }
  if (g.includes('mystery') || g.includes('thriller') || g.includes('crime') || g.includes('suspense') || g.includes('detective') || g.includes('psycholog') || g.includes('drama')) {
    return {
      bg: 'bg-amber-950/80 dark:bg-amber-900/60',
      text: 'text-amber-200 dark:text-amber-300',
      border: 'border-amber-400/50',
      glow: 'shadow-[0_0_14px_rgba(251,191,36,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
    };
  }
  if (g.includes('classic') || g.includes('philosophy') || g.includes('history') || g.includes('historical') || g.includes('allegory')) {
    return {
      bg: 'bg-emerald-950/80 dark:bg-emerald-900/60',
      text: 'text-emerald-200 dark:text-emerald-300',
      border: 'border-emerald-400/50',
      glow: 'shadow-[0_0_14px_rgba(52,211,153,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
    };
  }
  if (g.includes('literary') || g.includes('coming-of-age') || g.includes('poetry') || g.includes('contemporary') || g.includes('memoir') || g.includes('biography') || g.includes('fiction')) {
    return {
      bg: 'bg-indigo-950/80 dark:bg-indigo-900/60',
      text: 'text-indigo-200 dark:text-indigo-300',
      border: 'border-indigo-400/50',
      glow: 'shadow-[0_0_14px_rgba(129,140,248,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
    };
  }

  return {
    bg: 'bg-rose-950/80 dark:bg-rose-900/60',
    text: 'text-rose-200 dark:text-rose-300',
    border: 'border-rose-400/50',
    glow: 'shadow-[0_0_14px_rgba(244,63,94,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
  };
}

export function extractActualGenres(doc: any): { primary: string; all: string[] } {
  const rawSubjects: string[] = Array.isArray(doc.subject) ? doc.subject : [];
  
  const junkPatterns = [
    /^nyt:/i, /^award:/i, /bestseller/i, /new york times/i, /protected daisy/i,
    /accessible book/i, /lending library/i, /in library/i, /open library/i,
    /\(imaginary place\)/i, /works by one author/i, /fictional works/i,
    /overdrive/i, /internet archive/i
  ];

  const candidateGenres: string[] = [];

  for (const raw of rawSubjects) {
    if (!raw || typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (junkPatterns.some(p => p.test(trimmed))) continue;
    if (trimmed.length > 32 || trimmed.length < 3) continue;

    const lower = trimmed.toLowerCase();
    let clean = '';

    if (lower.includes('science fiction') || lower.includes('sci-fi')) clean = 'Science Fiction';
    else if (lower.includes('historical romance')) clean = 'Historical Romance';
    else if (lower.includes('contemporary romance')) clean = 'Contemporary Romance';
    else if (lower.includes('romance') || lower.includes('love stories')) clean = 'Romance';
    else if (lower.includes('high fantasy') || lower.includes('epic fantasy')) clean = 'High Fantasy';
    else if (lower.includes('magical realism') || lower.includes('magic realism')) clean = 'Magical Realism';
    else if (lower.includes('fantasy')) clean = 'Fantasy';
    else if (lower.includes('psychological fiction') || lower.includes('psychological thriller')) clean = 'Psychological Fiction';
    else if (lower.includes('thriller') || lower.includes('suspense')) clean = 'Thriller';
    else if (lower.includes('mystery') || lower.includes('detective')) clean = 'Mystery';
    else if (lower.includes('historical fiction')) clean = 'Historical Fiction';
    else if (lower.includes('coming of age') || lower.includes('coming-of-age')) clean = 'Coming-of-Age';
    else if (lower.includes('literary fiction')) clean = 'Literary Fiction';
    else if (lower.includes('dystopian') || lower.includes('dystopia')) clean = 'Dystopian Fiction';
    else if (lower.includes('mythology') || lower.includes('mythological')) clean = 'Mythological Retelling';
    else if (lower.includes('philosophical') || lower.includes('philosophy')) clean = 'Philosophical Fiction';
    else if (lower.includes('poetry') || lower.includes('poems')) clean = 'Poetry';
    else if (lower.includes('memoir') || lower.includes('autobiography')) clean = 'Memoir';
    else if (lower.includes('biography')) clean = 'Biography';
    else if (lower.includes('personal growth') || lower.includes('self-help')) clean = 'Personal Growth';
    else if (lower.includes('psychology')) clean = 'Psychology';
    else {
      const stripped = trimmed
        .replace(/^fiction,\s*/i, '')
        .replace(/,\s*fiction$/i, '')
        .replace(/\s*\([^)]*\)$/, '')
        .trim();
      if (stripped && stripped.toLowerCase() !== 'fiction' && stripped.length <= 26) {
        clean = stripped.split(',')[0].trim();
        clean = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }

    if (clean && !candidateGenres.includes(clean)) {
      candidateGenres.push(clean);
    }
  }

  const all = candidateGenres.slice(0, 3);
  return {
    primary: all[0] || 'Literary Fiction',
    all: all.length > 0 ? all : ['Literary Fiction']
  };
}

const DEFAULT_BOOKS: SavedBook[] = [
  {
    id: 'book-1',
    title: 'Normal People',
    author: 'Sally Rooney',
    coverUrl: 'https://covers.openlibrary.org/b/id/8794265-M.jpg',
    genre: 'Literary Fiction',
    genres: ['Literary Fiction', 'Contemporary Romance', 'Coming-of-Age'],
    shelf: 'reading',
    rating: 5,
    addedBy: 'Ifa',
    notes: 'Our current late-night read together 💕',
    year: '2018'
  },
  {
    id: 'book-2',
    title: 'The Night Circus',
    author: 'Erin Morgenstern',
    coverUrl: 'https://covers.openlibrary.org/b/id/8314134-M.jpg',
    genre: 'Historical Fantasy',
    genres: ['Historical Fantasy', 'Magical Realism', 'Gothic Romance'],
    shelf: 'reading',
    rating: 5,
    addedBy: 'Mahad',
    notes: 'Pure magic, dreamlike tents and infinite wonders ✨',
    year: '2011'
  },
  {
    id: 'book-3',
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    coverUrl: 'https://covers.openlibrary.org/b/id/12836267-M.jpg',
    genre: 'Historical Fiction',
    genres: ['Historical Fiction', 'Psychological Drama', 'Romance'],
    shelf: 'favorites',
    rating: 5,
    addedBy: 'Ifa',
    notes: 'Ifa’s absolute favorite story of all time 🌷',
    year: '2017'
  },
  {
    id: 'book-4',
    title: 'The Song of Achilles',
    author: 'Madeline Miller',
    coverUrl: 'https://covers.openlibrary.org/b/id/8235111-M.jpg',
    genre: 'Mythological Retelling',
    genres: ['Mythological Retelling', 'Historical Fantasy', 'Epic Romance'],
    shelf: 'favorites',
    rating: 5,
    addedBy: 'Mahad',
    notes: '“He is half of my soul, as the poets say.” 🌹',
    year: '2011'
  },
  {
    id: 'book-5',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    coverUrl: 'https://covers.openlibrary.org/b/id/10531580-M.jpg',
    genre: 'Philosophical Fiction',
    genres: ['Philosophical Fiction', 'Allegory', 'Classic Literature'],
    shelf: 'favorites',
    rating: 5,
    addedBy: 'Ifa',
    notes: 'It is only with the heart that one can see rightly 🦊⭐',
    year: '1943'
  },
  {
    id: 'book-6',
    title: 'Before the Coffee Gets Cold',
    author: 'Toshikazu Kawaguchi',
    coverUrl: 'https://covers.openlibrary.org/b/id/10297074-M.jpg',
    genre: 'Magical Realism',
    genres: ['Magical Realism', 'Time Travel Fiction', 'Cozy Fantasy'],
    shelf: 'wishlist',
    rating: 5,
    addedBy: 'Mahad',
    notes: 'A quiet Tokyo café that lets you travel back in time ☕',
    year: '2015'
  },
  {
    id: 'book-7',
    title: 'A Court of Thorns and Roses',
    author: 'Sarah J. Maas',
    coverUrl: 'https://covers.openlibrary.org/b/id/10398642-M.jpg',
    genre: 'Romantic Fantasy',
    genres: ['Romantic Fantasy', 'High Fantasy', 'Faerie Lore'],
    shelf: 'wishlist',
    rating: 5,
    addedBy: 'Ifa',
    notes: 'High fantasy romance for rainy weekend afternoons 🌙',
    year: '2015'
  },
  {
    id: 'book-8',
    title: 'Norwegian Wood',
    author: 'Haruki Murakami',
    coverUrl: 'https://covers.openlibrary.org/b/id/8231856-M.jpg',
    genre: 'Coming-of-Age Fiction',
    genres: ['Coming-of-Age Fiction', 'Psychological Drama', 'Literary Fiction'],
    shelf: 'wishlist',
    rating: 4,
    addedBy: 'Mahad',
    notes: 'Melancholic, poetic and deeply atmospheric 🍂',
    year: '1987'
  }
];

const SHELVES_CONFIG = [
  {
    id: 'reading' as ShelfCategory,
    title: 'Currently Reading Together',
    emoji: '💕',
    subtitle: 'Chapters we share under cozy blankets'
  },
  {
    id: 'favorites' as ShelfCategory,
    title: 'Our All-Time Favorites',
    emoji: '🌷',
    subtitle: 'Stories that have earned a permanent place in our hearts'
  },
  {
    id: 'wishlist' as ShelfCategory,
    title: 'Our Fairytale Wishlist',
    emoji: '✨',
    subtitle: 'Adventures waiting for our next rainy afternoon'
  }
];

interface SharedLibraryViewProps {
  currentUser?: 'Mahad' | 'Ifa' | null;
}

export default function SharedLibraryView({ currentUser = 'Mahad' }: SharedLibraryViewProps) {
  // Reliable active user derivation from prop or sessionStorage
  const activeUser: 'Mahad' | 'Ifa' = useMemo(() => {
    if (currentUser === 'Mahad' || currentUser === 'Ifa') return currentUser;
    try {
      const session = sessionStorage.getItem('tulip_user');
      if (session === 'Mahad' || session === 'Ifa') return session as 'Mahad' | 'Ifa';
    } catch (e) {}
    return 'Mahad';
  }, [currentUser]);

  // Books State (persisted to localStorage with automatic genre upgrade)
  const [books, setBooks] = useState<SavedBook[]>(() => {
    try {
      const saved = localStorage.getItem('tulip_shared_library');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Upgrade any default books with their actual Google genres
          return parsed.map((b: any) => {
            const def = DEFAULT_BOOKS.find(d => d.id === b.id || d.title.toLowerCase() === b.title?.toLowerCase());
            if (def) {
              return { ...b, genre: def.genre, genres: def.genres };
            }
            return b;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load library:', e);
    }
    return DEFAULT_BOOKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('tulip_shared_library', JSON.stringify(books));
    } catch (e) {}
  }, [books]);

  // Active Shelf Filter: 'all' | 'reading' | 'favorites' | 'wishlist'
  const [activeFilter, setActiveFilter] = useState<'all' | ShelfCategory>('all');

  // User Ownership Filter: 'all' | 'Mahad' | 'Ifa'
  const [userFilter, setUserFilter] = useState<'all' | 'Mahad' | 'Ifa'>('all');

  // Custom Draft Modal State
  const [showCustomDraftModal, setShowCustomDraftModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customGenre, setCustomGenre] = useState('');
  const [customShelf, setCustomShelf] = useState<ShelfCategory>('reading');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected Book for Detail Modal
  const [selectedBook, setSelectedBook] = useState<SavedBook | null>(null);

  // Search API Logic (OpenLibrary Search API with debounce)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryClean = encodeURIComponent(searchQuery.trim());
        const res = await fetch(`https://openlibrary.org/search.json?q=${queryClean}&limit=6&fields=title,author_name,cover_i,first_publish_year,subject,key`);
        if (res.ok) {
          const data = await res.json();
          const items: SearchResultBook[] = (data.docs || []).map((doc: any, index: number) => {
            const coverId = doc.cover_i;
            const coverUrl = coverId 
              ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
              : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
            
            // Extract actual real genres from Google Books / OpenLibrary subjects
            const { primary, all } = extractActualGenres(doc);

            return {
              id: doc.key || `search-${index}`,
              title: doc.title || 'Untitled Book',
              author: Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author_name || 'Unknown Author'),
              coverUrl,
              genre: primary,
              genres: all,
              year: doc.first_publish_year?.toString() || ''
            };
          });
          setSearchResults(items);
          setShowResultsDropdown(true);
        }
      } catch (err) {
        console.warn('Search API error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Actions
  const handleAddSearchedBook = (book: SearchResultBook, targetShelf: ShelfCategory = 'wishlist') => {
    const newBook: SavedBook = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      genre: book.genre,
      genres: book.genres && book.genres.length > 0 ? book.genres : [book.genre],
      shelf: targetShelf,
      rating: 5,
      addedBy: activeUser,
      notes: `Added to our ${targetShelf} shelf with love by ${activeUser} 💕`,
      year: book.year
    };

    setBooks(prev => [newBook, ...prev]);
    setSearchQuery('');
    setShowResultsDropdown(false);
    if ('vibrate' in navigator) navigator.vibrate([40, 50]);
  };

  const handleAddCustomDraft = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTitle.trim()) return;

    const resolvedGenre = customGenre.trim() || 'Personal Draft';
    const newBook: SavedBook = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: customTitle.trim(),
      author: customAuthor.trim() || (activeUser === 'Mahad' ? 'Mahad' : 'Ifa'),
      coverUrl: customCoverUrl.trim() || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300',
      genre: resolvedGenre,
      genres: [resolvedGenre],
      shelf: customShelf,
      rating: 5,
      addedBy: activeUser,
      notes: customNotes.trim() || `Draft placed on our ${customShelf} shelf by ${activeUser} 💕`,
      year: new Date().getFullYear().toString()
    };

    setBooks(prev => [newBook, ...prev]);
    setShowCustomDraftModal(false);
    setCustomTitle('');
    setCustomAuthor('');
    setCustomGenre('');
    setCustomCoverUrl('');
    setCustomNotes('');
    if ('vibrate' in navigator) navigator.vibrate([40, 50]);
  };

  const handleUpdateShelf = (bookId: string, newShelf: ShelfCategory) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, shelf: newShelf } : b));
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook(prev => prev ? { ...prev, shelf: newShelf } : null);
    }
    if ('vibrate' in navigator) navigator.vibrate([30, 30]);
  };

  const handleUpdateNotes = (bookId: string, notes: string) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, notes } : b));
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook(prev => prev ? { ...prev, notes } : null);
    }
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
    setSelectedBook(null);
    if ('vibrate' in navigator) navigator.vibrate([50, 40]);
  };

  const filteredShelves = useMemo(() => {
    if (activeFilter === 'all') return SHELVES_CONFIG;
    return SHELVES_CONFIG.filter(s => s.id === activeFilter);
  }, [activeFilter]);

  return (
    <div className="flex-1 flex flex-col h-full rounded-[28px] sm:rounded-[36px] clay-card overflow-hidden border border-border relative select-none">
      
      {/* HEADER WITH ANIMATED SEARCH BAR, + ADD CUSTOM DRAFT, & FILTERS */}
      <div className="px-3.5 sm:px-8 py-3 sm:py-5 border-b border-border bg-surface/95 backdrop-blur-md flex flex-col gap-2.5 sm:gap-3.5 relative z-20">
        
        {/* Top Row: Title, User State & + Add Draft Button */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Title & Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-[22px] clay-btn text-white flex items-center justify-center shrink-0 shadow-md">
              <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-2xl font-bold font-serif-italic text-text-main flex items-center gap-1.5 leading-tight truncate">
                <span>Shared Library</span>
                <span className="font-fairytale text-base sm:text-xl text-pastel-pink-400 lowercase font-normal hidden xs:inline">for mahad & ifa</span>
              </h2>
              <p className="text-[10px] sm:text-xs text-text-muted font-medium flex items-center gap-1.5 truncate mt-0.5">
                <span>{books.length} volumes</span>
                <span className="inline-block w-1 h-1 rounded-full bg-pastel-pink-400" />
                <span className="font-semibold text-text-main/80 truncate">Active: {activeUser === 'Mahad' ? 'Mahad 🌹' : 'Ifa 🌷'}</span>
              </p>
            </div>
          </div>

          {/* + Add Custom Draft Button */}
          <button
            onClick={() => {
              setCustomAuthor(activeUser === 'Mahad' ? 'Mahad' : 'Ifa');
              setShowCustomDraftModal(true);
            }}
            className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full clay-btn text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            title={`Add a custom draft or personal book as ${activeUser}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Add Custom Draft</span>
            <span className="sm:hidden text-[10.5px] font-extrabold">+ Draft</span>
          </button>
        </div>

        {/* Search Bar Row: Floating glass-clay pill */}
        <div className="relative group transition-all duration-300 w-full">
          <div className="flex items-center px-3.5 py-1.5 sm:py-2 rounded-full clay-card border border-border/70 backdrop-blur-md focus-within:ring-2 sm:focus-within:ring-4 focus-within:ring-[var(--accent-glow)] focus-within:border-pastel-pink-400 focus-within:shadow-[0_0_20px_var(--accent-glow)] transition-all duration-300 w-full">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pastel-pink-400 animate-spin mr-2 shrink-0" />
            ) : (
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted group-hover:text-pastel-pink-400 transition-colors mr-2 shrink-0" />
            )}
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowResultsDropdown(true); }}
              placeholder="Search any book or author..."
              className="w-full bg-transparent text-xs text-text-main placeholder-text-muted/60 outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowResultsDropdown(false); }}
                className="p-1 rounded-full text-text-muted hover:text-text-main transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showResultsDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={springBezier}
                className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-96 p-2.5 sm:p-3 rounded-[24px] sm:rounded-[28px] clay-card bg-surface/98 backdrop-blur-2xl border border-border shadow-2xl z-50 flex flex-col gap-2 max-h-80 sm:max-h-96 overflow-y-auto"
              >
                <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Search Results ({searchResults.length})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-pastel-pink-400/15 text-pastel-pink-400 text-[9px] font-bold">
                      Adding as {activeUser} {activeUser === 'Mahad' ? '🌹' : '🌷'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowResultsDropdown(false)}
                    className="text-[10px] font-bold text-pastel-pink-400 hover:underline cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                {searchResults.map((result) => {
                  const tagStyle = getGenreBadgeStyle(result.genre);
                  const allGenres = result.genres && result.genres.length > 0 ? result.genres : [result.genre];

                  return (
                    <div
                      key={result.id}
                      className="p-2 sm:p-2.5 rounded-2xl bg-surface-hover/70 hover:bg-surface-hover border border-border/40 hover:border-pastel-pink-400/40 transition-all flex items-center justify-between gap-2.5 group"
                    >
                      <img
                        src={result.coverUrl}
                        alt={result.title}
                        loading="lazy"
                        decoding="async"
                        className="w-9 h-13 sm:w-10 sm:h-14 object-cover rounded-md shadow-sm border border-black/10 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-text-main truncate font-serif-italic">
                          {result.title}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-text-muted truncate">
                          {result.author} {result.year ? `(${result.year})` : ''}
                        </p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {allGenres.slice(0, 2).map((g) => {
                            const s = getGenreBadgeStyle(g);
                            return (
                              <span key={g} className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider ${s.bg} ${s.text} ${s.border} ${s.glow}`}>
                                {g}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => handleAddSearchedBook(result, 'reading')}
                          className="px-2 py-1 rounded-full bg-pastel-pink-400/20 hover:bg-pastel-pink-400 text-pastel-pink-400 hover:text-white text-[9.5px] sm:text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title={`Add to Reading as ${activeUser}`}
                        >
                          <Plus className="w-3 h-3" /> Reading
                        </button>
                        <button
                          onClick={() => handleAddSearchedBook(result, 'wishlist')}
                          className="px-2 py-1 rounded-full bg-surface hover:bg-surface-hover border border-border text-text-muted hover:text-text-main text-[9.5px] sm:text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title={`Add to Wishlist as ${activeUser}`}
                        >
                          <Bookmark className="w-3 h-3" /> Wishlist
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Row: Fluid, Horizontally Scrollable Pills for User Ownership & Shelf Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 shelf-track">
          
          {/* User Ownership Toggles */}
          <button
            onClick={() => setUserFilter('all')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              userFilter === 'all'
                ? 'clay-btn text-white shadow-xs'
                : 'bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/50'
            }`}
          >
            All Books
          </button>
          <button
            onClick={() => setUserFilter('Mahad')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
              userFilter === 'Mahad'
                ? 'clay-btn text-white shadow-xs'
                : 'bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/50'
            }`}
          >
            <span>Added by Mahad</span>
            <span>🌹</span>
          </button>
          <button
            onClick={() => setUserFilter('Ifa')}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
              userFilter === 'Ifa'
                ? 'clay-btn text-white shadow-xs'
                : 'bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/50'
            }`}
          >
            <span>Added by Ifa</span>
            <span>🌷</span>
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-border/60 shrink-0 mx-0.5" />

          {/* Shelf Category Filter Pills */}
          {(['all', 'reading', 'favorites', 'wishlist'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            const labels = {
              all: 'All Shelves',
              reading: 'Reading 💕',
              favorites: 'Favorites 🌷',
              wishlist: 'Wishlist ✨'
            };
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive 
                    ? 'clay-btn text-white shadow-xs' 
                    : 'bg-surface-hover/80 text-text-muted hover:text-text-main border border-border/50'
                }`}
              >
                {labels[filter]}
              </button>
            );
          })}

        </div>

      </div>

      {/* 3D CLAY SHELVES CONTAINER (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3.5 sm:px-8 py-4 sm:py-8 space-y-7 sm:space-y-12 relative z-10 overscroll-contain">
        
        {filteredShelves.map((shelf) => {
          const shelfBooks = books.filter(b => {
            const matchesShelf = b.shelf === shelf.id;
            const matchesUser = userFilter === 'all' || b.addedBy === userFilter;
            return matchesShelf && matchesUser;
          });

          return (
            <div key={shelf.id} className="relative flex flex-col shelf-section-deferred">
              
              {/* Shelf Header */}
              <div className="flex items-center justify-between mb-3 sm:mb-5 px-1">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className="text-lg sm:text-xl select-none">{shelf.emoji}</span>
                  <div>
                    <h3 className="text-base sm:text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
                      <span>{shelf.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-pastel-pink-400/15 border border-pastel-pink-400/30 text-pastel-pink-400 text-[9.5px] sm:text-[10px] font-bold">
                        {shelfBooks.length} {shelfBooks.length === 1 ? 'book' : 'books'}
                        {userFilter !== 'all' ? ` by ${userFilter}` : ''}
                      </span>
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-text-muted font-medium">
                      {shelf.subtitle}
                    </p>
                  </div>
                </div>

                {shelfBooks.length === 0 && (
                  <span className="text-[11px] text-text-muted italic">
                    {userFilter === 'all' 
                      ? 'Empty shelf — search a book above or add a custom draft!' 
                      : `No books added by ${userFilter} on this shelf yet.`}
                  </span>
                )}
              </div>

              {/* 3D BOOK VOLUMES ON SHELF (Fluid Touch-Horizontal Shelf Track) */}
              <div className="relative min-h-[220px] sm:min-h-[270px] md:min-h-[310px] flex items-end justify-start gap-4 sm:gap-7 md:gap-8 flex-nowrap overflow-x-auto snap-x snap-mandatory shelf-track no-scrollbar pb-5 pt-12 sm:pt-14 px-4 sm:px-6">
                {shelfBooks.map((book) => {
                  const tagStyle = getGenreBadgeStyle(book.genre);

                  return (
                    <div 
                      key={book.id}
                      className="shrink-0 flex flex-col items-center snap-start"
                      style={{ perspective: '1000px' }}
                    >
                      {/* 3D Rectangular Volume Resting on the Shelf */}
                      <motion.div
                        whileHover={{
                          y: -12,
                          scale: 1.04,
                          rotateX: -4,
                          rotateY: 4,
                          transition: springBezier
                        }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedBook(book)}
                        style={{
                          transformStyle: 'preserve-3d',
                          willChange: 'transform',
                          transform: 'translateZ(0)',
                          backfaceVisibility: 'hidden',
                          boxShadow: 'inset 8px 0 16px -2px rgba(0,0,0,0.6), inset 1px 0 2px rgba(255,255,255,0.4), 0 10px 22px -5px rgba(0,0,0,0.45)'
                        }}
                        className="relative w-32 sm:w-36 md:w-44 h-44 sm:h-52 md:h-64 rounded-r-xl rounded-l-[4px] cursor-pointer select-none border-t border-b border-r border-white/20 bg-stone-900 group"
                      >
                        {/* Inner Clipped Book Cover & Decorative Layers */}
                        <div className="absolute inset-0 rounded-r-xl rounded-l-[4px] overflow-hidden">
                          {/* Book Spine Crease & Shadow on Left */}
                          <div className="absolute inset-y-0 left-0 w-3.5 sm:w-4 bg-gradient-to-r from-black/60 via-black/20 to-transparent border-r border-black/35 z-20 pointer-events-none" />
                          <div className="absolute inset-y-0 left-2.5 sm:left-3 w-px bg-white/25 z-20 pointer-events-none" />

                          {/* Top / Right Paper Pages Highlight Edge */}
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-l from-stone-200 via-stone-300 to-transparent dark:from-stone-600 dark:via-stone-700 opacity-60 z-20 pointer-events-none" />
                          <div className="absolute top-0 inset-x-0 h-1 bg-white/30 z-20 pointer-events-none" />

                          {/* Front Face Book Cover */}
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded-r-xl rounded-l-[4px] group-hover:brightness-105 transition-all duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
                            }}
                          />

                          {/* Bottom Gradient Overlay for Title, Author & User Ownership */}
                          <div className="absolute inset-x-0 bottom-0 pt-8 sm:pt-10 pb-2 px-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10 flex flex-col justify-end">
                            <h4 className="text-white text-[11px] sm:text-xs font-bold leading-tight font-serif-italic truncate drop-shadow-sm">
                              {book.title}
                            </h4>
                            <div className="flex items-center justify-between gap-1 mt-0.5">
                              <p className="text-stone-300 text-[9px] sm:text-[10px] truncate leading-tight flex-1">
                                {book.author}
                              </p>
                              <span 
                                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-black/50 text-white/95 border border-white/10 shrink-0"
                                title={`Added by ${book.addedBy}`}
                              >
                                {book.addedBy === 'Mahad' ? '🌹 M' : '🌷 I'}
                              </span>
                            </div>
                          </div>

                          {/* Hover Quick Action Heart/Star Badge */}
                          <div className="absolute top-2 left-4 sm:left-5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <div className="p-1 rounded-full bg-black/60 backdrop-blur-md text-pastel-pink-400 shadow-md">
                              <Heart className="w-3.5 h-3.5 fill-pastel-pink-400" />
                            </div>
                          </div>
                        </div>

                        {/* Floating Avatar Badge (Top-Right Overlapping Clay Badge) */}
                        <div
                          className={`absolute -top-2 -right-1.5 sm:-top-3 sm:-right-2.5 z-30 w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center select-none pointer-events-none border border-white/40 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1 group-hover:scale-110 ${
                            book.addedBy === 'Mahad'
                              ? 'bg-gradient-to-br from-blue-400 via-indigo-600 to-blue-700 text-white'
                              : 'bg-gradient-to-br from-pink-300 via-rose-400 to-rose-600 text-white'
                          }`}
                          style={{
                            boxShadow: book.addedBy === 'Mahad'
                              ? 'inset 0 2px 3px rgba(255,255,255,0.4), 0 3px 6px -1px rgba(0,0,0,0.5), 0 0 8px rgba(59,130,246,0.4)'
                              : 'inset 0 2px 3px rgba(255,255,255,0.4), 0 3px 6px -1px rgba(0,0,0,0.5), 0 0 8px rgba(244,63,94,0.4)',
                            transform: 'translateZ(24px)'
                          }}
                          title={`Added by ${book.addedBy}`}
                        >
                          <div className="flex items-center justify-center leading-none text-white drop-shadow-xs">
                            <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-tighter mr-0.5">
                              {book.addedBy === 'Mahad' ? 'M' : 'I'}
                            </span>
                            <span className="text-[8.5px] sm:text-[10px]">
                              {book.addedBy === 'Mahad' ? '🌹' : '🌷'}
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Vibrant Actual Genre Tag & Owner Pill */}
                      <div className="mt-2 select-none z-10 flex items-center justify-center gap-1 max-w-[128px] sm:max-w-[170px] flex-nowrap">
                        <span 
                          className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider border truncate max-w-[95px] sm:max-w-none ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} ${tagStyle.glow}`}
                          title={book.genre}
                        >
                          {book.genre}
                        </span>
                        <span 
                          className="inline-block px-1.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold bg-surface/90 border border-border text-text-muted shadow-2xs shrink-0"
                          title={`Brought to shelf by ${book.addedBy}`}
                        >
                          {book.addedBy === 'Mahad' ? '🌹' : '🌷'}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* 3D CLAY SHELF DIVIDER (Thick, rounded clay bar with deep drop shadow & bright top-inner highlight) */}
              <div className="relative w-full mt-2 select-none pointer-events-none">
                {/* Upper Surface / Clay Shelf Lip */}
                <div 
                  className="h-3.5 sm:h-4.5 w-full rounded-full bg-gradient-to-r from-surface-hover via-surface to-surface-hover border-t border-white/35"
                  style={{
                    boxShadow: 'inset 0 2px 5px rgba(255, 255, 255, 0.25), 0 8px 16px -6px rgba(0, 0, 0, 0.45)'
                  }}
                />
                {/* Deep Under-Shelf Shadow & Bottom Edge Bevel */}
                <div className="h-2 sm:h-2.5 w-[98.5%] mx-auto -mt-1 rounded-b-2xl bg-gradient-to-b from-black/35 to-transparent" />
              </div>

            </div>
          );
        })}

      </div>

      {/* BOOK DETAIL MODAL */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={springBezier}
              className="max-w-md w-full p-4 sm:p-7 rounded-[28px] sm:rounded-[36px] clay-card bg-surface border border-border shadow-2xl flex flex-col relative overflow-hidden max-h-[90dvh] overflow-y-auto"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pastel-pink-300 via-pastel-pink-400 to-pastel-peach" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 sm:p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Book Info Section */}
              <div className="flex gap-3 sm:gap-5 items-start mt-1 sm:mt-2">
                {/* 3D Book Volume Miniature */}
                <div 
                  className="w-20 sm:w-28 h-30 sm:h-42 rounded-r-xl rounded-l-[4px] overflow-hidden shrink-0 relative border-t border-r border-white/30"
                  style={{
                    boxShadow: 'inset 8px 0 14px -2px rgba(0,0,0,0.65), 0 12px 24px -6px rgba(0,0,0,0.5)'
                  }}
                >
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/60 to-transparent border-r border-black/30 z-20 pointer-events-none" />
                  <img
                    src={selectedBook.coverUrl}
                    alt={selectedBook.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                  <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2 flex-wrap">
                    {(selectedBook.genres && selectedBook.genres.length > 0 ? selectedBook.genres : [selectedBook.genre]).map((g) => {
                      const style = getGenreBadgeStyle(g);
                      return (
                        <span key={g} className={`px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${style.glow}`}>
                          {g}
                        </span>
                      );
                    })}
                    <span className="px-2 py-0.5 rounded-full bg-pastel-pink-400/15 border border-pastel-pink-400/30 text-pastel-pink-400 text-[8.5px] sm:text-[9px] font-bold flex items-center gap-1 ml-0.5">
                      <span>Brought by {selectedBook.addedBy}</span>
                      <span>{selectedBook.addedBy === 'Mahad' ? '🌹' : '🌷'}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-xl font-bold font-serif-italic text-text-main leading-tight">
                    {selectedBook.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-text-muted font-medium mt-0.5">
                    by {selectedBook.author} {selectedBook.year ? `(${selectedBook.year})` : ''}
                  </p>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mt-1.5 sm:mt-2 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Shelf Selection Tabs */}
              <div className="mt-4 sm:mt-6">
                <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5 sm:mb-2">
                  Shelf Placement
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {(['reading', 'favorites', 'wishlist'] as ShelfCategory[]).map((shelfId) => {
                    const isCurrent = selectedBook.shelf === shelfId;
                    const labels: Record<ShelfCategory, string> = {
                      reading: 'Reading 💕',
                      favorites: 'Favorites 🌷',
                      wishlist: 'Wishlist ✨'
                    };
                    return (
                      <button
                        key={shelfId}
                        onClick={() => handleUpdateShelf(selectedBook.id, shelfId)}
                        className={`py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-bold text-center transition-all cursor-pointer border ${
                          isCurrent
                            ? 'clay-btn text-white border-transparent shadow-xs'
                            : 'bg-surface-hover/70 hover:bg-surface-hover border-border text-text-muted hover:text-text-main'
                        }`}
                      >
                        {labels[shelfId]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Romantic Couple Note */}
              <div className="mt-3.5 sm:mt-5">
                <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                  Our Thoughts & Memories
                </label>
                <textarea
                  value={selectedBook.notes || ''}
                  onChange={(e) => handleUpdateNotes(selectedBook.id, e.target.value)}
                  placeholder="Leave a sweet thought or favorite quote here..."
                  rows={2}
                  className="w-full bg-surface-hover p-2.5 sm:p-3 rounded-2xl border border-border text-xs text-text-main placeholder-text-muted/60 outline-none focus:border-pastel-pink-400 focus:ring-2 focus:ring-pastel-pink-400/20 font-medium resize-none shadow-inner"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border/40">
                <button
                  onClick={() => handleDeleteBook(selectedBook.id)}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-red-400 hover:text-red-500 hover:bg-red-500/10 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>

                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full clay-btn text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM DRAFT MODAL */}
      <AnimatePresence>
        {showCustomDraftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={springBezier}
              className="max-w-md w-full p-4 sm:p-7 rounded-[28px] sm:rounded-[36px] clay-card bg-surface border border-border shadow-2xl flex flex-col relative overflow-hidden max-h-[90dvh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-border/40 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full clay-btn text-white flex items-center justify-center text-sm shadow-xs">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-bold font-serif-italic text-text-main leading-tight">
                      Add Custom Book or Draft
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-text-muted">
                      Bring your personal favorite to our shared library
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomDraftModal(false)}
                  className="p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active User Ownership Banner */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-surface-hover/80 border border-border/50 mb-3 sm:mb-4">
                <span className="text-[11px] sm:text-xs text-text-muted font-medium">Adding to shelf as:</span>
                <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold clay-btn text-white shadow-xs flex items-center gap-1">
                  <span>{activeUser}</span>
                  <span>{activeUser === 'Mahad' ? '🌹' : '🌷'}</span>
                </span>
              </div>

              <form onSubmit={handleAddCustomDraft} className="space-y-3 sm:space-y-4">
                {/* Book Title */}
                <div>
                  <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Book Title <span className="text-pastel-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Midnight Letters, Our Tokyo Journal..."
                    className="w-full bg-surface-hover px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-border text-xs text-text-main placeholder-text-muted/60 outline-none focus:border-pastel-pink-400 focus:ring-2 focus:ring-pastel-pink-400/20 font-medium shadow-inner"
                  />
                </div>

                {/* Author Name */}
                <div>
                  <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Author / Creator
                  </label>
                  <input
                    type="text"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    placeholder={`e.g. ${activeUser}, or author name`}
                    className="w-full bg-surface-hover px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-border text-xs text-text-main placeholder-text-muted/60 outline-none focus:border-pastel-pink-400 focus:ring-2 focus:ring-pastel-pink-400/20 font-medium shadow-inner"
                  />
                </div>

                {/* Genre & Quick Tags */}
                <div>
                  <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Genre / Classification
                  </label>
                  <input
                    type="text"
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    placeholder="e.g. Contemporary Romance, Cozy Fantasy..."
                    className="w-full bg-surface-hover px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-border text-xs text-text-main placeholder-text-muted/60 outline-none focus:border-pastel-pink-400 focus:ring-2 focus:ring-pastel-pink-400/20 font-medium shadow-inner mb-1.5"
                  />
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    {['Contemporary Romance', 'Romantic Fantasy', 'Magical Realism', 'Poetry'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCustomGenre(preset)}
                        className="px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold bg-surface hover:bg-surface-hover border border-border text-text-muted hover:text-pastel-pink-400 transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Shelf Selection */}
                <div>
                  <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Target Shelf
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {(['reading', 'favorites', 'wishlist'] as ShelfCategory[]).map((shelfId) => {
                      const isSelected = customShelf === shelfId;
                      const labels: Record<ShelfCategory, string> = {
                        reading: 'Reading 💕',
                        favorites: 'Favorites 🌷',
                        wishlist: 'Wishlist ✨'
                      };
                      return (
                        <button
                          key={shelfId}
                          type="button"
                          onClick={() => setCustomShelf(shelfId)}
                          className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-bold text-center transition-all cursor-pointer border ${
                            isSelected
                              ? 'clay-btn text-white border-transparent shadow-xs'
                              : 'bg-surface-hover/70 hover:bg-surface-hover border-border text-text-muted hover:text-text-main'
                          }`}
                        >
                          {labels[shelfId]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cover URL (Optional) */}
                <div>
                  <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Cover Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={customCoverUrl}
                    onChange={(e) => setCustomCoverUrl(e.target.value)}
                    placeholder="https://... (or leave blank for romantic default)"
                    className="w-full bg-surface-hover px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-border text-xs text-text-main placeholder-text-muted/60 outline-none focus:border-pastel-pink-400 focus:ring-2 focus:ring-pastel-pink-400/20 font-medium shadow-inner"
                  />
                </div>

                {/* Romantic Note */}
                <div>
                  <label className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Special Thought or Dedication (Optional)
                  </label>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={2}
                    placeholder="Why this volume is special to us..."
                    className="w-full bg-surface-hover px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-border text-xs text-text-main placeholder-text-muted/60 outline-none focus:border-pastel-pink-400 focus:ring-2 focus:ring-pastel-pink-400/20 font-medium resize-none shadow-inner"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2.5 sm:pt-3 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setShowCustomDraftModal(false)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold text-text-muted hover:text-text-main cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full clay-btn text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Place on Shelf</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
