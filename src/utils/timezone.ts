// src/utils/timezone.ts

export const POPULAR_CITIES = [
  { city: 'Lahore, PK', tz: 'Asia/Karachi', label: 'Lahore (PKT)' },
  { city: 'London, UK', tz: 'Europe/London', label: 'London (GMT/BST)' },
  { city: 'Islamabad, PK', tz: 'Asia/Karachi', label: 'Islamabad (PKT)' },
  { city: 'Karachi, PK', tz: 'Asia/Karachi', label: 'Karachi (PKT)' },
  { city: 'Rawalpindi, PK', tz: 'Asia/Karachi', label: 'Rawalpindi (PKT)' },
  { city: 'Manchester, UK', tz: 'Europe/London', label: 'Manchester (GMT/BST)' },
  { city: 'Birmingham, UK', tz: 'Europe/London', label: 'Birmingham (GMT/BST)' },
  { city: 'New York, US', tz: 'America/New_York', label: 'New York (EST/EDT)' },
  { city: 'Los Angeles, US', tz: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { city: 'Chicago, US', tz: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { city: 'Toronto, CA', tz: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { city: 'Vancouver, CA', tz: 'America/Vancouver', label: 'Vancouver (PST/PDT)' },
  { city: 'Dubai, UAE', tz: 'Asia/Dubai', label: 'Dubai (GST)' },
  { city: 'Doha, QA', tz: 'Asia/Qatar', label: 'Doha (AST)' },
  { city: 'Riyadh, SA', tz: 'Asia/Riyadh', label: 'Riyadh (AST)' },
  { city: 'Paris, FR', tz: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { city: 'Berlin, DE', tz: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { city: 'Tokyo, JP', tz: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { city: 'Sydney, AU', tz: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
];

export const MAJOR_TIMEZONES = [
  { tz: 'Asia/Karachi', label: 'Asia/Karachi (PKT - Pakistan UTC+5)' },
  { tz: 'Europe/London', label: 'Europe/London (GMT/BST - United Kingdom UTC+0/+1)' },
  { tz: 'Asia/Dubai', label: 'Asia/Dubai (GST - UAE / Gulf UTC+4)' },
  { tz: 'Asia/Riyadh', label: 'Asia/Riyadh (AST - Saudi Arabia UTC+3)' },
  { tz: 'Asia/Qatar', label: 'Asia/Qatar (AST - Qatar UTC+3)' },
  { tz: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - India UTC+5:30)' },
  { tz: 'Asia/Dhaka', label: 'Asia/Dhaka (BST - Bangladesh UTC+6)' },
  { tz: 'America/New_York', label: 'America/New_York (EST/EDT - US Eastern UTC-5/-4)' },
  { tz: 'America/Chicago', label: 'America/Chicago (CST/CDT - US Central UTC-6/-5)' },
  { tz: 'America/Denver', label: 'America/Denver (MST/MDT - US Mountain UTC-7/-6)' },
  { tz: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT - US Pacific UTC-8/-7)' },
  { tz: 'America/Toronto', label: 'America/Toronto (Canada Eastern UTC-5/-4)' },
  { tz: 'America/Vancouver', label: 'America/Vancouver (Canada Pacific UTC-8/-7)' },
  { tz: 'Europe/Paris', label: 'Europe/Paris (CET/CEST - France UTC+1/+2)' },
  { tz: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST - Germany UTC+1/+2)' },
  { tz: 'Europe/Rome', label: 'Europe/Rome (CET/CEST - Italy UTC+1/+2)' },
  { tz: 'Europe/Madrid', label: 'Europe/Madrid (CET/CEST - Spain UTC+1/+2)' },
  { tz: 'Europe/Istanbul', label: 'Europe/Istanbul (TRT - Turkey UTC+3)' },
  { tz: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - Japan UTC+9)' },
  { tz: 'Asia/Seoul', label: 'Asia/Seoul (KST - South Korea UTC+9)' },
  { tz: 'Asia/Singapore', label: 'Asia/Singapore (SGT - Singapore UTC+8)' },
  { tz: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT - Sydney UTC+10/+11)' },
  { tz: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT - New Zealand UTC+12/+13)' }
];

export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}

export function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (e) {
    return MAJOR_TIMEZONES.map(m => m.tz);
  }
}

let serverTimeOffset: number = (() => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('aim_online_time_offset');
      if (cached) {
        const parsed = parseFloat(cached);
        if (!isNaN(parsed) && isFinite(parsed)) return parsed;
      }
    } catch (e) {}
  }
  return 0;
})();

let isSyncing = false;

/**
 * Synchronizes with real global online UTC time.
 * Queries trusted edge networks (Cloudflare Atomic NTP trace, TimeAPI, GitHub)
 * to completely eliminate PC / phone clock skew.
 */
export async function syncNetworkTime(force = false) {
  if (isSyncing) return;
  isSyncing = true;

  const onlineSources = [
    // Source 1: Cloudflare Global Edge trace (Ultra fast, atomic clock, CORS enabled)
    async () => {
      const t0 = Date.now();
      const res = await fetch('https://cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
      const text = await res.text();
      const match = text.match(/ts=([0-9.]+)/);
      if (!match) throw new Error('No ts in Cloudflare trace');
      const serverMs = parseFloat(match[1]) * 1000;
      const latency = (Date.now() - t0) / 2;
      return (serverMs + latency) - Date.now();
    },
    // Source 2: timeapi.io dedicated time API
    async () => {
      const t0 = Date.now();
      const res = await fetch('https://timeapi.io/api/time/current/zone?timeZone=UTC', { cache: 'no-store' });
      const data = await res.json();
      const serverMs = new Date(data.dateTime + 'Z').getTime();
      const latency = (Date.now() - t0) / 2;
      return (serverMs + latency) - Date.now();
    },
    // Source 3: GitHub API response date header
    async () => {
      const t0 = Date.now();
      const res = await fetch('https://api.github.com', { cache: 'no-store' });
      const dateH = res.headers.get('date');
      if (!dateH) throw new Error('No date header');
      const serverMs = new Date(dateH).getTime();
      const latency = (Date.now() - t0) / 2;
      return (serverMs + latency) - Date.now();
    }
  ];

  for (const source of onlineSources) {
    try {
      const offset = await source();
      serverTimeOffset = offset;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aim_online_time_offset', offset.toString());
          window.dispatchEvent(new CustomEvent('aim:timesync', { detail: { offset } }));
        } catch (e) {}
      }
      console.log('[AIM] True Online Time Synced. Offset:', Math.round(offset / 1000), 'seconds');
      break;
    } catch (e) {
      // Continue to fallback source
    }
  }

  isSyncing = false;
}

// Auto-trigger online sync on startup and on window focus / visibility change
if (typeof window !== 'undefined') {
  syncNetworkTime();
  window.addEventListener('focus', () => syncNetworkTime());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncNetworkTime();
    }
  });
  // Re-sync every 5 minutes
  setInterval(() => syncNetworkTime(), 5 * 60 * 1000);
}

/**
 * Returns the true current timestamp, corrected for device clock skew.
 */
export function getNetworkNow(): number {
  return Date.now() + serverTimeOffset;
}

/**
 * Returns a Date object representing the true current network time.
 */
export function getNetworkDate(): Date {
  return new Date(getNetworkNow());
}

const CITY_KEYWORD_MAP: Array<{ keywords: string[]; tz: string }> = [
  { keywords: ['london', 'uk', 'england', 'britain', 'manchester', 'birmingham', 'edinburgh', 'glasgow', 'gmt', 'bst'], tz: 'Europe/London' },
  { keywords: ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'pakistan', 'peshawar', 'multan', 'faisalabad', 'quetta', 'pk', 'pkt'], tz: 'Asia/Karachi' },
  { keywords: ['dubai', 'uae', 'abu dhabi', 'sharjah', 'emirates', 'gst'], tz: 'Asia/Dubai' },
  { keywords: ['riyadh', 'jeddah', 'makkah', 'mecca', 'medina', 'saudi', 'ast'], tz: 'Asia/Riyadh' },
  { keywords: ['doha', 'qatar'], tz: 'Asia/Qatar' },
  { keywords: ['delhi', 'mumbai', 'bangalore', 'bengaluru', 'kolkata', 'hyderabad', 'india', 'ist'], tz: 'Asia/Kolkata' },
  { keywords: ['dhaka', 'bangladesh'], tz: 'Asia/Dhaka' },
  { keywords: ['new york', 'nyc', 'brooklyn', 'manhattan', 'boston', 'philadelphia', 'miami', 'atlanta', 'est', 'edt'], tz: 'America/New_York' },
  { keywords: ['los angeles', 'california', 'la', 'san francisco', 'sf', 'seattle', 'san diego', 'pst', 'pdt'], tz: 'America/Los_Angeles' },
  { keywords: ['chicago', 'illinois', 'houston', 'dallas', 'austin', 'cst', 'cdt'], tz: 'America/Chicago' },
  { keywords: ['denver', 'colorado', 'phoenix', 'arizona', 'mst', 'mdt'], tz: 'America/Denver' },
  { keywords: ['toronto', 'ontario', 'ottawa', 'montreal', 'canada'], tz: 'America/Toronto' },
  { keywords: ['vancouver', 'bc', 'british columbia'], tz: 'America/Vancouver' },
  { keywords: ['paris', 'france', 'lyon', 'marseille'], tz: 'Europe/Paris' },
  { keywords: ['berlin', 'germany', 'munich', 'frankfurt'], tz: 'Europe/Berlin' },
  { keywords: ['rome', 'italy', 'milan'], tz: 'Europe/Rome' },
  { keywords: ['madrid', 'spain', 'barcelona'], tz: 'Europe/Madrid' },
  { keywords: ['istanbul', 'turkey', 'ankara'], tz: 'Europe/Istanbul' },
  { keywords: ['tokyo', 'japan', 'osaka', 'kyoto'], tz: 'Asia/Tokyo' },
  { keywords: ['seoul', 'korea'], tz: 'Asia/Seoul' },
  { keywords: ['singapore'], tz: 'Asia/Singapore' },
  { keywords: ['sydney', 'australia', 'melbourne', 'canberra'], tz: 'Australia/Sydney' }
];

/**
 * Resolves the accurate IANA timezone string for a city / timezone pair.
 * If tz is explicitly passed and valid, it takes top priority.
 * Otherwise it intelligently analyzes the city text.
 */
export function resolveTimezone(city?: string, tz?: string, fallback = 'Asia/Karachi'): string {
  // 1. Explicit valid IANA timezone (highest priority)
  if (tz && isValidTimezone(tz)) {
    return tz;
  }

  // 2. City name heuristic mapping
  const cityText = (city || '').trim().toLowerCase();
  if (cityText) {
    for (const mapping of CITY_KEYWORD_MAP) {
      if (mapping.keywords.some(k => cityText.includes(k))) {
        return mapping.tz;
      }
    }
  }

  return isValidTimezone(fallback) ? fallback : 'Asia/Karachi';
}

export function formatTimeInZone(date: Date, timezone: string) {
  const safeTz = isValidTimezone(timezone) ? timezone : 'Asia/Karachi';
  try {
    const formattedTime = date.toLocaleTimeString('en-US', {
      timeZone: safeTz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const hour24 = parseInt(
      date.toLocaleTimeString('en-US', { timeZone: safeTz, hour: 'numeric', hour12: false }),
      10
    );
    const isDaytime = hour24 >= 6 && hour24 < 18;
    return { formattedTime, isDaytime };
  } catch (e) {
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const hour24 = date.getHours();
    return { formattedTime, isDaytime: hour24 >= 6 && hour24 < 18 };
  }
}

/**
 * Formats a message timestamp into clean 12-hour format in the given timezone.
 */
export function formatMessageTime(timestamp: number | string | Date, timezone: string = 'Asia/Karachi'): string {
  const numTime = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (isNaN(numTime)) return '';

  const safeTz = isValidTimezone(timezone) ? timezone : 'Asia/Karachi';
  const date = new Date(numTime);

  try {
    return date.toLocaleTimeString('en-US', {
      timeZone: safeTz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}
