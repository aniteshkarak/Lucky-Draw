import { LocalParticipationRecord } from '../types';

const STORAGE_PREFIX = 'lucky_draw_participation_';
const LAST_EVENT_KEY = 'lucky_draw_last_event_id';

/**
 * Generates the event-scoped localStorage key
 */
export function getEventStorageKey(eventId: string): string {
  return `${STORAGE_PREFIX}${eventId}`;
}

/**
 * Retrieve saved user participation for a specific event
 */
export function getEventParticipation(eventId?: string): LocalParticipationRecord | null {
  if (!eventId) return null;
  try {
    const raw = localStorage.getItem(getEventStorageKey(eventId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.event_id === eventId && parsed.lucky_number) {
      return parsed as LocalParticipationRecord;
    }
  } catch (err) {
    console.warn('Error reading event participation from localStorage:', err);
  }
  return null;
}

/**
 * Save user participation record to localStorage for a specific event ID
 */
export function saveEventParticipation(
  eventId: string,
  participant: {
    name: string;
    lucky_number: number;
    played_at?: string;
  }
): LocalParticipationRecord {
  const record: LocalParticipationRecord = {
    event_id: eventId,
    name: participant.name,
    lucky_number: participant.lucky_number,
    status: 'REGISTERED',
    played_at: participant.played_at || new Date().toISOString(),
  };

  try {
    localStorage.setItem(getEventStorageKey(eventId), JSON.stringify(record));
    localStorage.setItem(LAST_EVENT_KEY, eventId);
  } catch (err) {
    console.warn('Error saving participation to localStorage:', err);
  }

  return record;
}

/**
 * Check if the browser has already participated in this specific event ID
 */
export function hasParticipatedInEvent(eventId?: string): boolean {
  if (!eventId) return false;
  return getEventParticipation(eventId) !== null;
}

/**
 * Automatically clear participation record for a finalized event once winners have been announced.
 * Only called after winner selection has successfully completed.
 */
export function clearFinalizedEventParticipation(eventId?: string): void {
  if (!eventId) return;
  try {
    localStorage.removeItem(getEventStorageKey(eventId));
    // Also remove legacy key if present
    localStorage.removeItem('dada_my_ticket');
  } catch (err) {
    console.warn('Error clearing finalized event participation:', err);
  }
}

/**
 * When a new event opens with a different event ID, ensure previous old events do not block participation.
 */
export function handleNewEventTransition(currentEventId: string): void {
  if (!currentEventId) return;
  try {
    const currentKey = getEventStorageKey(currentEventId);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && key !== currentKey) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(LAST_EVENT_KEY, currentEventId);
  } catch {
    // ignore
  }
}
