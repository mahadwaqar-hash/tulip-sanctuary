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

export type BookGenre = 'Romance' | 'Fantasy' | 'Sci-Fi' | 'Mystery' | 'Poetry' | 'Classic';
export type ShelfCategory = 'reading' | 'favorites' | 'wishlist';

export interface SavedBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  genre: BookGenre;
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
  genre: BookGenre;
  year?: string;
}

const GENRE_TAG_STYLES: Record<BookGenre, { bg: string; text: string; border: string; glow: string }> = {
  Fantasy: {
    bg: 'bg-purple-950/80 dark:bg-purple-900/60',
    text: 'text-purple-200 dark:text-purple-300',
    border: 'border-purple-400/50',
    glow: 'shadow-[0_0_14px_rgba(168,85,247,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
  },
  Romance: {
    bg: 'bg-rose-950/80 dark:bg-rose-900/60',
    text: 'text-rose-200 dark:text-rose-300',
    border: 'border-rose-400/50',
    glow: 'shadow-[0_0_14px_rgba(244,63,94,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
  },
  'Sci-Fi': {
    bg: 'bg-teal-950/80 dark:bg-teal-900/60',
    text: 'text-teal-200 dark:text-teal-300',
    border: 'border-teal-400/50',
    glow: 'shadow-[0_0_14px_rgba(45,212,191,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
  },
  Mystery: {
    bg: 'bg-amber-950/80 dark:bg-amber-900/60',
    text: 'text-amber-200 dark:text-amber-300',
    border: 'border-amber-400/50',
    glow: 'shadow-[0_0_14px_rgba(251,191,36,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
  },
  Poetry: {
    bg: 'bg-pink-950/80 dark:bg-pink-900/60',
    text: 'text-pink-200 dark:text-pink-300',
    border: 'border-pink-400/50',
    glow: 'shadow-[0_0_14px_rgba(244,114,182,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
  },
  Classic: {
    bg: 'bg-emerald-950/80 dark:bg-emerald-900/60',
    text: 'text-emerald-200 dark:text-emerald-300',
    border: 'border-emerald-400/50',
    glow: 'shadow-[0_0_14px_rgba(52,211,153,0.55),inset_0_1px_2px_rgba(255,255,255,0.4)]'
  }
};

const DEFAULT_BOOKS: SavedBook[] = [
  {
    id: 'book-1',
    title: 'Normal People',
    author: 'Sally Rooney',
    coverUrl: 'https://covers.openlibrary.org/b/id/8794265-L.jpg',
    genre: 'Romance',
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
    coverUrl: 'https://covers.openlibrary.org/b/id/8314134-L.jpg',
    genre: 'Fantasy',
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
    coverUrl: 'https://covers.openlibrary.org/b/id/12836267-L.jpg',
    genre: 'Romance',
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
    coverUrl: 'https://covers.openlibrary.org/b/id/8235111-L.jpg',
    genre: 'Fantasy',
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
    coverUrl: 'https://covers.openlibrary.org/b/id/10531580-L.jpg',
    genre: 'Classic',
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
    coverUrl: 'https://covers.openlibrary.org/b/id/10297074-L.jpg',
    genre: 'Sci-Fi',
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
    coverUrl: 'https://covers.openlibrary.org/b/id/10398642-L.jpg',
    genre: 'Fantasy',
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
    coverUrl: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
    genre: 'Poetry',
    shelf: 'wishlist',
    rating: 4,
    addedBy: 'Mahad',
    notes: 'Melancholic, poetic and deeply atmospheric 🍂',
    year: '1987'
  }
];

interface SharedLibraryViewProps {
  currentUser?: 'Mahad' | 'Ifa' | null;
}

export default function SharedLibraryView({ currentUser = 'Mahad' }: SharedLibraryViewProps) {
  // Books State (persisted to localStorage)
  const [books, setBooks] = useState<SavedBook[]>(() => {
    try {
      const saved = localStorage.getItem('tulip_shared_library');
      if (saved) return JSON.parse(saved);
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
        const res = await fetch(`https://openlibrary.org/search.json?q=${queryClean}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          const items: SearchResultBook[] = (data.docs || []).map((doc: any, index: number) => {
            const coverId = doc.cover_i;
            const coverUrl = coverId 
              ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
              : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
            
            // Infer genre from subjects or cycle tastefully
            const subjects = Array.isArray(doc.subject) ? doc.subject.join(' ').toLowerCase() : '';
            let genre: BookGenre = 'Romance';
            if (subjects.includes('fantasy') || subjects.includes('magic')) genre = 'Fantasy';
            else if (subjects.includes('science fiction') || subjects.includes('space')) genre = 'Sci-Fi';
            else if (subjects.includes('mystery') || subjects.includes('crime') || subjects.includes('thriller')) genre = 'Mystery';
            else if (subjects.includes('poetry') || subjects.includes('poem')) genre = 'Poetry';
            else if (subjects.includes('classic') || subjects.includes('literature')) genre = 'Classic';
            else {
              const genres: BookGenre[] = ['Romance', 'Fantasy', 'Sci-Fi', 'Mystery', 'Poetry', 'Classic'];
              genre = genres[index % genres.length];
            }

            return {
              id: doc.key || `search-${index}`,
              title: doc.title || 'Untitled Book',
              author: Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author_name || 'Unknown Author'),
              coverUrl,
              genre,
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
      shelf: targetShelf,
      rating: 5,
      addedBy: (currentUser as 'Mahad' | 'Ifa') || 'Mahad',
      notes: `Added to our ${targetShelf} shelf with love 💕`,
      year: book.year
    };

    setBooks(prev => [newBook, ...prev]);
    setSearchQuery('');
    setShowResultsDropdown(false);
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

  // Group books by shelf
  const shelvesConfig = [
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

  const filteredShelves = useMemo(() => {
    if (activeFilter === 'all') return shelvesConfig;
    return shelvesConfig.filter(s => s.id === activeFilter);
  }, [activeFilter]);

  return (
    <div className="flex-1 flex flex-col h-full rounded-[36px] clay-card overflow-hidden border border-border relative select-none">
      
      {/* SVG Noise Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* HEADER WITH ANIMATED EXPANDABLE SEARCH BAR & FILTERS */}
      <div className="px-6 sm:px-8 py-5 border-b border-border bg-surface/85 backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
        
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[22px] clay-btn text-white flex items-center justify-center shrink-0 shadow-md">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-italic text-text-main flex items-center gap-2 leading-tight">
              <span>Shared Library</span>
              <span className="font-fairytale text-xl text-pastel-pink-400 lowercase font-normal">for mahad & ifa</span>
            </h2>
            <p className="text-xs text-text-muted font-medium mt-0.5 flex items-center gap-2">
              <span>{books.length} volumes nestled on our 3D shelves</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-pastel-pink-400" />
              <span>{currentUser === 'Mahad' ? 'Mahad’s Haven 🌹' : 'Ifa’s Haven 🌷'}</span>
            </p>
          </div>
        </div>

        {/* Search Bar & Shelves Filter Pills */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          
          {/* Animated Search Bar: Floating glass-clay pill that expands and glows on focus */}
          <div className="relative group transition-all duration-300 w-full sm:w-auto">
            <div className="flex items-center px-4 py-2.5 rounded-full clay-card border border-border/70 backdrop-blur-xl focus-within:ring-4 focus-within:ring-[var(--accent-glow)] focus-within:border-pastel-pink-400 focus-within:shadow-[0_0_24px_var(--accent-glow)] transition-all duration-300 w-full sm:w-56 focus-within:sm:w-80">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-pastel-pink-400 animate-spin mr-2 shrink-0" />
              ) : (
                <Search className="w-4 h-4 text-text-muted group-hover:text-pastel-pink-400 transition-colors mr-2 shrink-0" />
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
                  className="absolute right-0 top-full mt-3 w-full sm:w-96 p-3 rounded-[28px] clay-card bg-surface/95 backdrop-blur-2xl border border-border shadow-2xl z-50 flex flex-col gap-2 max-h-96 overflow-y-auto"
                >
                  <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Search Results ({searchResults.length})
                    </span>
                    <button
                      onClick={() => setShowResultsDropdown(false)}
                      className="text-[10px] font-bold text-pastel-pink-400 hover:underline cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  {searchResults.map((result) => {
                    const tagStyle = GENRE_TAG_STYLES[result.genre] || GENRE_TAG_STYLES.Romance;
                    return (
                      <div
                        key={result.id}
                        className="p-2.5 rounded-2xl bg-surface-hover/70 hover:bg-surface-hover border border-border/40 hover:border-pastel-pink-400/40 transition-all flex items-center justify-between gap-3 group"
                      >
                        <img
                          src={result.coverUrl}
                          alt={result.title}
                          className="w-10 h-14 object-cover rounded-md shadow-sm border border-black/10 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-text-main truncate font-serif-italic">
                            {result.title}
                          </h4>
                          <p className="text-[11px] text-text-muted truncate">
                            {result.author} {result.year ? `(${result.year})` : ''}
                          </p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} ${tagStyle.glow}`}>
                            {result.genre}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => handleAddSearchedBook(result, 'reading')}
                            className="px-2 py-1 rounded-full bg-pastel-pink-400/20 hover:bg-pastel-pink-400 text-pastel-pink-400 hover:text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Add to Reading"
                          >
                            <Plus className="w-3 h-3" /> Reading
                          </button>
                          <button
                            onClick={() => handleAddSearchedBook(result, 'wishlist')}
                            className="px-2 py-1 rounded-full bg-surface hover:bg-surface-hover border border-border text-text-muted hover:text-text-main text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="Add to Wishlist"
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

          {/* Shelf Category Filter Pills */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-surface-hover/80 border border-border/50">
            {(['all', 'reading', 'favorites', 'wishlist'] as const).map((filter) => {
              const isActive = activeFilter === filter;
              const labels = {
                all: 'All Books',
                reading: 'Reading 💕',
                favorites: 'Favorites 🌷',
                wishlist: 'Wishlist ✨'
              };
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'clay-btn text-white shadow-xs' 
                      : 'text-text-muted hover:text-text-main hover:bg-surface/60'
                  }`}
                >
                  {labels[filter]}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* 3D CLAY SHELVES CONTAINER (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 space-y-12 relative z-10">
        
        {filteredShelves.map((shelf) => {
          const shelfBooks = books.filter(b => b.shelf === shelf.id);

          return (
            <div key={shelf.id} className="relative flex flex-col">
              
              {/* Shelf Header */}
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl select-none">{shelf.emoji}</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif-italic text-text-main flex items-center gap-2">
                      <span>{shelf.title}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-pastel-pink-400/15 border border-pastel-pink-400/30 text-pastel-pink-400 text-[10px] font-bold">
                        {shelfBooks.length} {shelfBooks.length === 1 ? 'book' : 'books'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-text-muted font-medium">
                      {shelf.subtitle}
                    </p>
                  </div>
                </div>

                {shelfBooks.length === 0 && (
                  <span className="text-xs text-text-muted italic">
                    Empty shelf — search a book above to place it here!
                  </span>
                )}
              </div>

              {/* 3D BOOK VOLUMES ON SHELF (Perspective Stage) */}
              <div 
                className="relative min-h-[220px] sm:min-h-[260px] md:min-h-[290px] flex items-end justify-start gap-5 sm:gap-7 md:gap-9 flex-wrap sm:flex-nowrap overflow-x-auto pb-2 px-3 pt-6"
                style={{ perspective: '1200px' }}
              >
                {shelfBooks.map((book) => {
                  const tagStyle = GENRE_TAG_STYLES[book.genre] || GENRE_TAG_STYLES.Romance;

                  return (
                    <div 
                      key={book.id}
                      className="shrink-0 flex flex-col items-center"
                      style={{ perspective: '1000px' }}
                    >
                      {/* 3D Rectangular Volume Resting on the Shelf */}
                      <motion.div
                        whileHover={{
                          y: -14,
                          scale: 1.05,
                          rotateX: -5,
                          rotateY: 5,
                          transition: springBezier
                        }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setSelectedBook(book)}
                        style={{
                          transformStyle: 'preserve-3d',
                          boxShadow: 'inset 10px 0 18px -2px rgba(0,0,0,0.65), inset 1px 0 2px rgba(255,255,255,0.4), 0 14px 28px -6px rgba(0,0,0,0.5)'
                        }}
                        className="relative w-28 sm:w-36 md:w-44 h-40 sm:h-52 md:h-64 rounded-r-xl rounded-l-[4px] overflow-hidden cursor-pointer select-none border-t border-b border-r border-white/20 bg-stone-900 group"
                      >
                        {/* Book Spine Crease & Shadow on Left */}
                        <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/60 via-black/20 to-transparent border-r border-black/35 z-20 pointer-events-none" />
                        <div className="absolute inset-y-0 left-3 w-px bg-white/25 z-20 pointer-events-none" />

                        {/* Top / Right Paper Pages Highlight Edge */}
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-l from-stone-200 via-stone-300 to-transparent dark:from-stone-600 dark:via-stone-700 opacity-60 z-20 pointer-events-none" />
                        <div className="absolute top-0 inset-x-0 h-1 bg-white/30 z-20 pointer-events-none" />

                        {/* Front Face Book Cover */}
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover rounded-r-xl rounded-l-[4px] group-hover:brightness-105 transition-all duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400';
                          }}
                        />

                        {/* Bottom Gradient Overlay for Title & Genre */}
                        <div className="absolute inset-x-0 bottom-0 pt-10 pb-2.5 px-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10 flex flex-col justify-end">
                          <h4 className="text-white text-[11px] sm:text-xs font-bold leading-tight font-serif-italic truncate drop-shadow-sm">
                            {book.title}
                          </h4>
                          <p className="text-stone-300 text-[9px] sm:text-[10px] truncate leading-tight mt-0.5">
                            {book.author}
                          </p>
                        </div>

                        {/* Hover Quick Action Heart/Star Badge */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <div className="p-1 rounded-full bg-black/60 backdrop-blur-md text-pastel-pink-400 shadow-md">
                            <Heart className="w-3.5 h-3.5 fill-pastel-pink-400" />
                          </div>
                        </div>
                      </motion.div>

                      {/* Vibrant Theme Tag: Tiny ultra-rounded clay pill with high-contrast neon/pastel glow based on genre */}
                      <div className="mt-2.5 select-none z-10">
                        <span 
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-transform hover:scale-105 ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} ${tagStyle.glow}`}
                        >
                          {book.genre}
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
                  className="h-4.5 w-full rounded-full bg-gradient-to-r from-surface-hover via-surface to-surface-hover border-t border-white/35"
                  style={{
                    boxShadow: 'inset 0 3px 6px rgba(255, 255, 255, 0.2), 0 12px 20px -8px rgba(0, 0, 0, 0.6)'
                  }}
                />
                {/* Deep Under-Shelf Shadow & Bottom Edge Bevel */}
                <div className="h-2.5 w-[98.5%] mx-auto -mt-1 rounded-b-2xl bg-black/40 blur-[1px]" />
              </div>

            </div>
          );
        })}

      </div>

      {/* BOOK DETAIL MODAL */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={springBezier}
              className="max-w-md w-full p-6 sm:p-8 rounded-[36px] clay-card bg-surface border border-border shadow-2xl flex flex-col relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pastel-pink-300 via-pastel-pink-400 to-pastel-peach" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-text-main cursor-pointer hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Book Info Section */}
              <div className="flex gap-5 items-start mt-2">
                {/* 3D Book Volume Miniature */}
                <div 
                  className="w-24 sm:w-28 h-36 sm:h-42 rounded-r-xl rounded-l-[4px] overflow-hidden shrink-0 relative border-t border-r border-white/30"
                  style={{
                    boxShadow: 'inset 8px 0 14px -2px rgba(0,0,0,0.65), 0 12px 24px -6px rgba(0,0,0,0.5)'
                  }}
                >
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/60 to-transparent border-r border-black/30 z-20 pointer-events-none" />
                  <img
                    src={selectedBook.coverUrl}
                    alt={selectedBook.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {(() => {
                      const tagStyle = GENRE_TAG_STYLES[selectedBook.genre] || GENRE_TAG_STYLES.Romance;
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border} ${tagStyle.glow}`}>
                          {selectedBook.genre}
                        </span>
                      );
                    })()}
                    <span className="text-[10px] text-text-muted font-medium">
                      Added by {selectedBook.addedBy}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold font-serif-italic text-text-main leading-tight">
                    {selectedBook.title}
                  </h3>
                  <p className="text-xs text-text-muted font-medium mt-0.5">
                    by {selectedBook.author} {selectedBook.year ? `(${selectedBook.year})` : ''}
                  </p>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mt-2 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Shelf Selection Tabs */}
              <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                  Shelf Placement
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                        className={`py-2 px-2 rounded-2xl text-[11px] font-bold text-center transition-all cursor-pointer border ${
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
              <div className="mt-5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                  Our Thoughts & Memories
                </label>
                <textarea
                  value={selectedBook.notes || ''}
                  onChange={(e) => handleUpdateNotes(selectedBook.id, e.target.value)}
                  placeholder="Leave a sweet thought or favorite quote here..."
                  rows={3}
                  className="w-full bg-surface-hover p-3 rounded-2xl border border-border text-xs text-text-main placeholder-text-muted/60 outline-none focus:border-pastel-pink-400 focus:ring-2 focus:ring-pastel-pink-400/20 font-medium resize-none shadow-inner"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
                <button
                  onClick={() => handleDeleteBook(selectedBook.id)}
                  className="px-3.5 py-2 rounded-full text-red-400 hover:text-red-500 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove from Shelf
                </button>

                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-5 py-2 rounded-full clay-btn text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
