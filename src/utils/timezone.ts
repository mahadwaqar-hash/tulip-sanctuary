// src/utils/timezone.ts

export const POPULAR_CITIES = [
  { city: 'Lahore, PK', tz: 'Asia/Karachi', label: 'Lahore (PKT)' },
  { city: 'Karachi, PK', tz: 'Asia/Karachi', label: 'Karachi (PKT)' },
  { city: 'Islamabad, PK', tz: 'Asia/Karachi', label: 'Islamabad (PKT)' },
  { city: 'London, UK', tz: 'Europe/London', label: 'London (GMT/BST)' },
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
  { city: 'Rome, IT', tz: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { city: 'Istanbul, TR', tz: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
  { city: 'Tokyo, JP', tz: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { city: 'Seoul, KR', tz: 'Asia/Seoul', label: 'Seoul (KST)' },
  { city: 'Singapore, SG', tz: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { city: 'Kuala Lumpur, MY', tz: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (MYT)' },
  { city: 'Sydney, AU', tz: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { city: 'Melbourne, AU', tz: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { city: 'Auckland, NZ', tz: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' }
];

export function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (e) {
    return [
      'Asia/Karachi',
      'Europe/London',
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'America/Toronto',
      'Asia/Dubai',
      'Europe/Paris',
      'Asia/Tokyo',
      'Australia/Sydney'
    ];
  }
}

export function resolveTimezone(city?: string, tz?: string, fallback = 'Asia/Karachi'): string {
  // 1. Check if tz is already a valid IANA timezone name
  if (tz) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
      return tz;
    } catch (e) {}
  }

  // 2. Fuzzy match from city name or tz text
  const text = `${city || ''} ${tz || ''}`.toLowerCase();
  
  if (text.includes('london') || text.includes('uk') || text.includes('gmt') || text.includes('england') || text.includes('britain')) {
    return 'Europe/London';
  }
  if (text.includes('lahore') || text.includes('karachi') || text.includes('islamabad') || text.includes('pakistan') || text.includes('rawalpindi') || text.includes('pk')) {
    return 'Asia/Karachi';
  }
  if (text.includes('new york') || text.includes('nyc') || text.includes('brooklyn') || text.includes('est') || text.includes('edt')) {
    return 'America/New_York';
  }
  if (text.includes('los angeles') || text.includes('california') || text.includes('la') || text.includes('pst') || text.includes('pdt')) {
    return 'America/Los_Angeles';
  }
  if (text.includes('chicago') || text.includes('illinois') || text.includes('cst')) {
    return 'America/Chicago';
  }
  if (text.includes('toronto') || text.includes('ontario') || text.includes('canada')) {
    return 'America/Toronto';
  }
  if (text.includes('vancouver') || text.includes('bc')) {
    return 'America/Vancouver';
  }
  if (text.includes('dubai') || text.includes('uae') || text.includes('emirates')) {
    return 'Asia/Dubai';
  }
  if (text.includes('paris') || text.includes('france')) {
    return 'Europe/Paris';
  }
  if (text.includes('tokyo') || text.includes('japan')) {
    return 'Asia/Tokyo';
  }
  if (text.includes('sydney') || text.includes('australia') || text.includes('melbourne')) {
    return 'Australia/Sydney';
  }

  return fallback;
}

export function formatTimeInZone(date: Date, timezone: string) {
  try {
    const formattedTime = date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
    const hour = parseInt(
      date.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }),
      10
    );
    const isDaytime = hour >= 6 && hour < 18;
    return { formattedTime, isDaytime };
  } catch (e) {
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const hour = date.getHours();
    return { formattedTime, isDaytime: hour >= 6 && hour < 18 };
  }
}
