/**
 * Time and Timezone utilities for Asia/Kolkata (IST: UTC + 5:30)
 */

export const EVENT_CONFIG = {
  TITLE: "Dada's Birthday Lucky Draw",
  EVENT_DATE_STR: "25 October",
  EVENT_YEAR: 2026,
  EVENT_MONTH: 9, // October (0-indexed: 9)
  EVENT_DAY: 25,
  START_HOUR_IST: 20, // 8:00 PM
  START_MIN_IST: 0,
  END_HOUR_IST: 21,   // 9:00 PM
  END_MIN_IST: 0,
  TIMEZONE: "Asia/Kolkata",
  TIMEZONE_LABEL: "IST (India Standard Time)",
};

/**
 * Parses an IST date string (YYYY-MM-DD) and time string (HH:MM:SS) into a UTC JavaScript Date
 */
export function parseISTDate(dateStr?: string, timeStr?: string): Date {
  const safeDate = dateStr || '2026-10-09';
  const safeTime = timeStr || '20:00:00';
  const [year, month, day] = safeDate.split('-').map(Number);
  const [hour, min, sec] = safeTime.split(':').map(Number);

  // IST is UTC+5:30 -> Convert IST components to UTC
  const istMinutes = (hour || 0) * 60 + (min || 0);
  const utcMinutes = istMinutes - 330; // 5 hours 30 mins

  const utcHour = Math.floor(((utcMinutes + 1440) % 1440) / 60);
  const utcMin = ((utcMinutes + 1440) % 1440) % 60;
  const dayOffset = utcMinutes < 0 ? -1 : utcMinutes >= 1440 ? 1 : 0;

  return new Date(Date.UTC(year, (month || 1) - 1, (day || 1) + dayOffset, utcHour, utcMin, sec || 0));
}

/**
 * Formats a YYYY-MM-DD date into friendly text (e.g. "9 October 2026")
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '25 October 2026';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats HH:MM:SS time into friendly 12h format (e.g. "9:00 AM", "8:00 PM")
 */
export function formatDisplayTime(timeStr?: string): string {
  if (!timeStr) return '8:00 PM';
  try {
    const [hour, min] = timeStr.split(':').map(Number);
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const m = min ? `:${String(min).padStart(2, '0')}` : ':00';
    return `${h}${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

/**
 * Formats start and end times into a friendly range (e.g. "9:00 AM – 8:00 PM IST")
 */
export function formatTimeRange(startTime?: string, endTime?: string): string {
  return `${formatDisplayTime(startTime || '09:00:00')} – ${formatDisplayTime(endTime || '20:00:00')} IST`;
}

/**
 * Returns the current date/time in Asia/Kolkata timezone
 */
export function getNowInIST(): Date {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: EVENT_CONFIG.TIMEZONE });
  return new Date(istString);
}

/**
 * Returns the target Start Date object in IST
 */
export function getEventStartTime(): Date {
  return parseISTDate(EVENT_CONFIG.EVENT_YEAR + '-10-' + EVENT_CONFIG.EVENT_DAY, '20:00:00');
}

/**
 * Returns the target End Date object in IST
 */
export function getEventEndTime(): Date {
  return parseISTDate(EVENT_CONFIG.EVENT_YEAR + '-10-' + EVENT_CONFIG.EVENT_DAY, '21:00:00');
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

/**
 * Calculates remaining time until target timestamp
 */
export function calculateTimeRemaining(targetUtc: Date): TimeRemaining {
  const now = new Date().getTime();
  const target = targetUtc.getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isPast: false
  };
}

/**
 * Formats date into readable IST string (e.g. "8:00 PM IST")
 */
export function formatISTTime(dateStr?: string | Date): string {
  const d = dateStr ? (typeof dateStr === 'string' ? new Date(dateStr) : dateStr) : new Date();
  return d.toLocaleTimeString("en-IN", {
    timeZone: EVENT_CONFIG.TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }) + " IST";
}

/**
 * Formats played_at timestamp nicely for participant list
 */
export function formatPlayedAt(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      timeZone: EVENT_CONFIG.TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}
