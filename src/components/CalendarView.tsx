import { useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Heart, 
  Sparkles, 
  Trash2, 
  Clock
} from 'lucide-react';
import { useFirestore, fb } from '../firebase';
import type { CalendarEvent } from '../db';

const springConfig: Transition = { type: 'spring', stiffness: 400, damping: 26 };

interface CalendarViewProps {
  currentUser: 'Mahad' | 'Ifa';
}

const CATEGORIES = [
  { id: 'date', label: 'Date Night', emoji: '🍷', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
  { id: 'anniversary', label: 'Anniversary', emoji: '💍', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' },
  { id: 'call', label: 'Late Night Call', emoji: '📞', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
  { id: 'trip', label: 'Trip & Adventure', emoji: '✈️', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
  { id: 'special', label: 'Special Memory', emoji: '✨', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
];

export default function CalendarView({ currentUser }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('20:00');
  const [eventCategory, setEventCategory] = useState<'date' | 'anniversary' | 'call' | 'trip' | 'special'>('date');
  const [eventNote, setEventNote] = useState('');

  const events = useFirestore<CalendarEvent>('calendarEvents', 'createdAt', false);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    if ('vibrate' in navigator) navigator.vibrate(50);

    await fb.calendarEvents.add({
      id: crypto.randomUUID(),
      title: eventTitle.trim(),
      date: selectedDateStr,
      time: eventTime,
      category: eventCategory,
      note: eventNote.trim(),
      addedBy: currentUser,
      createdAt: Date.now()
    });

    setEventTitle('');
    setEventNote('');
    setShowAddModal(false);
  };

  const handleDeleteEvent = async (id: string) => {
    await fb.calendarEvents.delete(id);
  };

  // Filter events for currently selected day
  const selectedDayEvents = events.filter(e => e.date === selectedDateStr);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full rounded-[2.5rem] glass-panel shadow-2xl overflow-y-auto md:overflow-hidden border border-border">
      
      {/* LEFT: CALENDAR MONTH GRID */}
      <div className="flex-1 flex flex-col p-6 md:p-8 md:overflow-y-auto min-h-min">
        
        {/* Month Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pastel-pink-100 dark:bg-pastel-pink-400/20 text-pastel-pink-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif-italic text-text-main">
                {monthNames[month]} <span className="text-pastel-pink-400 font-sans">{year}</span>
              </h2>
              <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                Our Shared Timeline <Heart className="w-3 h-3 text-pastel-pink-400 fill-pastel-pink-400" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full border border-border bg-surface-hover hover:bg-pastel-pink-100 dark:hover:bg-pastel-pink-400/20 text-text-main transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-full border border-border bg-surface-hover hover:bg-pastel-pink-100 dark:hover:bg-pastel-pink-400/20 text-text-main transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-2xl p-1 opacity-20" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = selectedDateStr === dateStr;
            const dayEvents = events.filter(e => e.date === dateStr);
            const hasEvents = dayEvents.length > 0;

            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <motion.button
                key={dayNum}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`aspect-square rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between items-center transition-all cursor-pointer relative border ${
                  isSelected
                    ? 'bg-pastel-pink-400 text-white border-pastel-pink-400 shadow-md font-bold'
                    : isToday
                    ? 'border-pastel-pink-400 bg-surface-hover text-text-main font-bold'
                    : 'border-border/60 bg-surface-hover/50 hover:border-pastel-pink-300 text-text-main font-medium'
                }`}
              >
                <span className="text-xs sm:text-sm">{dayNum}</span>

                {/* Event Dots */}
                <div className="flex gap-1 items-center justify-center">
                  {hasEvents && (
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-pastel-pink-400 animate-pulse'}`} />
                  )}
                  {dayEvents.length > 1 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-pastel-pink-300'}`} />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

      </div>

      {/* RIGHT: SELECTED DATE EVENTS & DETAILS */}
      <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-border bg-surface/70 backdrop-blur-2xl p-6 md:p-8 flex flex-col md:h-full min-h-[400px]">
        
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-pastel-pink-400">
              Selected Day
            </span>
            <h3 className="text-xl font-bold font-serif-italic text-text-main">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })}
            </h3>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full bg-pastel-pink-400 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Event
          </motion.button>
        </div>

        {/* Day Events Stream */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {selectedDayEvents.map((evt) => {
            const cat = CATEGORIES.find(c => c.id === evt.category) || CATEGORIES[0];
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-surface-hover border border-border shadow-sm flex flex-col gap-2 relative group hover:border-pastel-pink-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${cat.color}`}>
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </span>
                  {evt.time && (
                    <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" /> {evt.time}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-text-main leading-tight">{evt.title}</h4>
                {evt.note && (
                  <p className="text-xs text-text-muted leading-relaxed font-normal">{evt.note}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[10px] text-text-muted">
                  <span>Planned with love by {evt.addedBy}</span>
                  <button
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}

          {selectedDayEvents.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted py-12">
              <Sparkles className="w-8 h-8 text-pastel-pink-400 mb-2 opacity-50" />
              <p className="text-sm font-medium">No plans scheduled yet.</p>
              <p className="text-xs opacity-70 mt-1">Tap "+ Add Event" to plan a date or reminder!</p>
            </div>
          )}
        </div>

      </div>

      {/* ADD EVENT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={springConfig}
              className="bg-surface glass-panel p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold font-serif-italic text-text-main">Plan Couple Event</h3>
                  <p className="text-xs text-text-muted mt-0.5">Date: {selectedDateStr}</p>
                </div>
                <div className="p-2 rounded-2xl bg-pastel-pink-100 text-pastel-pink-400">
                  <Heart className="w-5 h-5 fill-pastel-pink-400" />
                </div>
              </div>

              <form onSubmit={handleAddEvent} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Event Title (e.g. Candlelight Dinner at Aylanto)"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400"
                  required
                  autoFocus
                />

                <div className="flex gap-3">
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="flex-1 bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400"
                  />
                  <select
                    value={eventCategory}
                    onChange={(e: any) => setEventCategory(e.target.value)}
                    className="flex-1 bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-xs font-bold focus:border-pastel-pink-400"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Sweet notes, reservations, ideas, or dress code..."
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  rows={3}
                  className="bg-surface-hover p-3.5 rounded-2xl border border-border text-text-main outline-none text-sm font-medium focus:border-pastel-pink-400 resize-none"
                />

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-full border border-border text-text-muted hover:text-text-main text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-pastel-pink-400 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:bg-pastel-pink-300 transition-colors cursor-pointer"
                  >
                    Save Event 💕
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
