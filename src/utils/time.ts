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
  // 25 October 20:00:00 IST -> 14:30:00 UTC
  // UTC Month for Oct is 9
  return new Date(Date.UTC(EVENT_CONFIG.EVENT_YEAR, EVENT_CONFIG.EVENT_MONTH, EVENT_CONFIG.EVENT_DAY, 14, 30, 0));
}

/**
 * Returns the target End Date object in IST
 */
export function getEventEndTime(): Date {
  // 25 October 21:00:00 IST -> 15:30:00 UTC
  return new Date(Date.UTC(EVENT_CONFIG.EVENT_YEAR, EVENT_CONFIG.EVENT_MONTH, EVENT_CONFIG.EVENT_DAY, 15, 30, 0));
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
