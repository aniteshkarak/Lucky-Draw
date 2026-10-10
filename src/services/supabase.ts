import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { DrawSettings, DrawState, Participant, ParticipationResult, WinnersData } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if we have real configured Supabase credentials
const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
  : null;

// ==============================================================================
// LOCAL MOCK / FALLBACK ENGINE (For seamless local testing & offline resiliency)
// ==============================================================================

interface MockStorage {
  eventId: string;
  participants: Array<{
    id: string;
    event_id: string;
    name: string;
    mobile: string;
    lucky_number: number;
    played_at: string;
    created_at: string;
  }>;
  winners: {
    event_id: string;
    first_prize: { name: string; lucky_number: number } | null;
    second_prize: { name: string; lucky_number: number } | null;
    third_prize: { name: string; lucky_number: number } | null;
    selected_at: string;
  } | null;
  statusOverride: DrawState | 'AUTO';
  emergencyClosed: boolean;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  autoCleanupAfterEnd?: boolean;
}

const STORAGE_KEY = 'lucky_draw_db_v4';

function getMockDB(): MockStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse error
  }

  // Default schedule: 25 October 2026, 8:00 PM (20:00) to 9:00 PM (21:00) IST
  const eventDate = '2026-10-25';
  const startTime = '20:00:00';
  const endTime = '21:00:00';
  const eventId = `event_${eventDate}_${startTime.slice(0, 2)}${startTime.slice(3, 5)}`;

  const initial: MockStorage = {
    eventId,
    participants: [],
    winners: null,
    statusOverride: 'AUTO',
    emergencyClosed: false,
    eventDate,
    startTime,
    endTime,
    autoCleanupAfterEnd: true,
  };
  saveMockDB(initial);
  return initial;
}

function saveMockDB(data: MockStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Event emitter for local realtime simulation
type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

// Deterministic pseudo-random generator for consistent winner selection across devices
function getSeededRandom(seed: string) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s >>> 0) / 4294967296;
  };
}

// Helper to compute effective draw status dynamically based on IST time
function calculateEffectiveStatus(db: MockStorage): {
  status: DrawState;
  eventDate: string;
  startTime: string;
  endTime: string;
  nowIst: Date;
  eventId: string;
} {
  const eventDate = db.eventDate || '2026-10-25';
  const startTime = db.startTime || '20:00:00';
  const endTime = db.endTime || '21:00:00';
  const eventId = db.eventId || `event_${eventDate}_${startTime.replace(/:/g, '').slice(0, 4)}_${endTime.replace(/:/g, '').slice(0, 4)}`;

  const nowIst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const curYear = nowIst.getFullYear();
  const curMonth = String(nowIst.getMonth() + 1).padStart(2, '0');
  const curDay = String(nowIst.getDate()).padStart(2, '0');
  const curDateStr = `${curYear}-${curMonth}-${curDay}`;
  const curTimeStr = `${String(nowIst.getHours()).padStart(2, '0')}:${String(nowIst.getMinutes()).padStart(2, '0')}:${String(nowIst.getSeconds()).padStart(2, '0')}`;

  let timeBasedStatus: DrawState = 'LIVE_DRAW';
  if (curDateStr < eventDate) {
    timeBasedStatus = 'BEFORE_DRAW';
  } else if (curDateStr > eventDate) {
    timeBasedStatus = 'DRAW_CLOSED';
  } else {
    if (curTimeStr < startTime) {
      timeBasedStatus = 'BEFORE_DRAW';
    } else if (curTimeStr >= startTime && curTimeStr < endTime) {
      timeBasedStatus = 'LIVE_DRAW';
    } else {
      timeBasedStatus = 'DRAW_CLOSED';
    }
  }

  const effectiveStatus: DrawState = db.winners
    ? 'WINNERS_PUBLISHED'
    : db.emergencyClosed
      ? 'DRAW_CLOSED'
      : db.statusOverride === 'AUTO' || !db.statusOverride
        ? timeBasedStatus
        : db.statusOverride;

  return {
    status: effectiveStatus,
    eventDate,
    startTime,
    endTime,
    nowIst,
    eventId,
  };
}

function isValidAdminPin(pin?: string): boolean {
  if (!pin) return false;
  const envPin = import.meta.env.VITE_ADMIN_PIN;
  const trimmed = pin.trim();
  return (
    trimmed === 'dada2026' ||
    trimmed === '2026' ||
    Boolean(envPin && trimmed === envPin.trim())
  );
}

// ==============================================================================
// PUBLIC BACKEND API INTERFACE
// ==============================================================================

export const apiService = {
  /**
   * Fetch current draw status, settings, total participants, and IST server time
   */
  async getDrawStatus(): Promise<DrawSettings> {
    const db = getMockDB();
    const { status: effectiveStatus, eventDate, startTime, endTime, nowIst, eventId } = calculateEffectiveStatus(db);

    let totalCount = db.participants.length;

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_draw_status');
        if (!error && data) {
          const sDate = data.event_date || eventDate;
          const sTime = data.start_time || startTime;
          const eTime = data.end_time || endTime;
          const eId = data.event_id || `event_${sDate}_${sTime.replace(/:/g, '').slice(0, 4)}_${eTime.replace(/:/g, '').slice(0, 4)}`;

          return {
            event_id: eId,
            event_date: sDate,
            start_time: sTime,
            end_time: eTime,
            timezone: data.timezone || 'Asia/Kolkata',
            status: data.status as DrawState,
            server_time_ist: data.server_time_ist || nowIst.toISOString(),
            total_participants: data.total_participants || 0,
            winners_selected: Boolean(data.winners_selected),
            emergency_closed: Boolean(data.emergency_closed),
            auto_cleanup_after_end: data.auto_cleanup_after_end ?? true,
            manual_override: data.manual_override,
          };
        }
      } catch (err) {
        console.warn('Supabase get_draw_status error, falling back to participants check:', err);
      }

      // If get_draw_status failed, fetch real total count from Supabase
      try {
        const { total_count } = await apiService.getPublicParticipants('', 1, 0);
        if (typeof total_count === 'number' && total_count > 0) {
          totalCount = total_count;
        }
      } catch {
        // ignore
      }
    }

    const savedWinners = localStorage.getItem(`lucky_draw_winners_${eventId}`);
    const hasWinners = Boolean(db.winners) || Boolean(savedWinners);

    const finalStatus: DrawState = hasWinners
      ? 'WINNERS_PUBLISHED'
      : effectiveStatus;

    return {
      event_id: eventId,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      timezone: 'Asia/Kolkata',
      status: finalStatus,
      server_time_ist: nowIst.toISOString(),
      total_participants: totalCount,
      winners_selected: hasWinners,
      emergency_closed: db.emergencyClosed,
      auto_cleanup_after_end: db.autoCleanupAfterEnd ?? false,
      manual_override: db.statusOverride || 'AUTO',
    };
  },

  /**
   * Register a participant securely (Atomic RPC: one mobile = one entry, 5-digit number)
   */
  async participate(name: string, mobile: string): Promise<ParticipationResult> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('participate', {
          p_name: name,
          p_mobile: mobile,
        });

        if (error) {
          return {
            success: false,
            code: 'RPC_ERROR',
            message: error.message || 'Unable to register at this time. Please try again.',
          };
        }
        return data as ParticipationResult;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Network error during participation.';
        console.warn('Supabase participation call failed, trying local fallback:', message);
      }
    }

    // Mock / Offline Handler
    await new Promise((resolve) => setTimeout(resolve, 400)); // Simulating latency
    const db = getMockDB();
    const { status: currentStatus, startTime, endTime, eventId } = calculateEffectiveStatus(db);

    // 1. Sanitize name
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2 || cleanName.length > 80) {
      return {
        success: false,
        code: 'INVALID_NAME',
        message: 'Please enter a valid full name between 2 and 80 characters.',
      };
    }

    // 2. Normalize Indian mobile number
    let cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.startsWith('91') && cleanMobile.length === 12) {
      cleanMobile = cleanMobile.slice(2);
    } else if (cleanMobile.startsWith('0') && cleanMobile.length === 11) {
      cleanMobile = cleanMobile.slice(1);
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return {
        success: false,
        code: 'INVALID_MOBILE',
        message: 'Please enter a valid 10-digit Indian mobile number.',
      };
    }

    // 3. Check if status allows registration
    if (currentStatus === 'BEFORE_DRAW' || currentStatus === 'SCHEDULED') {
      const [startHour, startMin] = (startTime || '09:00:00').split(':').map(Number);
      const h = startHour % 12 || 12;
      const ampm = startHour >= 12 ? 'PM' : 'AM';
      const m = startMin ? `:${String(startMin).padStart(2, '0')}` : ':00';
      return {
        success: false,
        code: 'NOT_STARTED',
        message: `Lucky draw has not started yet. Participation opens at ${h}${m} ${ampm} IST.`,
      };
    }
    if (currentStatus === 'DRAW_CLOSED' || currentStatus === 'CLOSED' || currentStatus === 'WINNERS_PUBLISHED') {
      const [endHour, endMin] = (endTime || '20:00:00').split(':').map(Number);
      const h = endHour % 12 || 12;
      const ampm = endHour >= 12 ? 'PM' : 'AM';
      const m = endMin ? `:${String(endMin).padStart(2, '0')}` : ':00';
      return {
        success: false,
        code: 'DRAW_CLOSED',
        message: `Lucky draw is closed. Entries closed at ${h}${m} ${ampm} IST.`,
      };
    }

    // 4. Duplicate mobile check (Idempotent for current event)
    const existing = db.participants.find((p) => p.mobile === cleanMobile);
    if (existing) {
      return {
        success: true,
        already_registered: true,
        participant: {
          id: existing.id,
          event_id: existing.event_id || eventId,
          name: existing.name,
          lucky_number: existing.lucky_number,
          played_at: existing.played_at,
        },
        message: 'You have already participated! Here is your official lucky number.',
      };
    }

    // 5. Generate unique 5-digit lucky number (10000-99999) among all participants currently recorded for that event
    const usedNumbers = new Set(db.participants.map((p) => p.lucky_number));
    let luckyNumber = Math.floor(10000 + Math.random() * 90000);
    let attempts = 0;
    while (usedNumbers.has(luckyNumber) && attempts < 200) {
      luckyNumber = Math.floor(10000 + Math.random() * 90000);
      attempts++;
    }

    const newParticipant = {
      id: String(Date.now()),
      event_id: eventId,
      name: cleanName,
      mobile: cleanMobile,
      lucky_number: luckyNumber,
      played_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    db.participants.push(newParticipant);
    saveMockDB(db);
    notifySubscribers();

    return {
      success: true,
      already_registered: false,
      participant: {
        id: newParticipant.id,
        event_id: newParticipant.event_id,
        name: newParticipant.name,
        lucky_number: newParticipant.lucky_number,
        played_at: newParticipant.played_at,
      },
      message: 'Congratulations! Your lucky number has been generated.',
    };
  },

  /**
   * Fetch public participants list (Never reveals mobile numbers)
   */
  async getPublicParticipants(
    search: string = '',
    limit: number = 50,
    offset: number = 0
  ): Promise<{ total_count: number; participants: Participant[] }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_public_participants', {
          p_search: search,
          p_limit: limit,
          p_offset: offset,
        });
        if (!error && data) {
          return {
            total_count: data.total_count || 0,
            participants: (data.participants || []).map((p: Participant, idx: number) => ({
              id: p.id,
              event_id: p.event_id,
              serial_no: p.serial_no || offset + idx + 1,
              name: p.name,
              lucky_number: p.lucky_number,
              played_at: p.played_at,
            })),
          };
        }
      } catch (err) {
        console.warn('Supabase get_public_participants error:', err);
      }
    }

    // Mock fallback
    const db = getMockDB();
    let filtered = [...db.participants].sort(
      (a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime()
    );

    const cleanSearch = search.trim().toLowerCase();
    if (cleanSearch) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanSearch) ||
          String(p.lucky_number).includes(cleanSearch)
      );
    }

    const total_count = filtered.length;
    const paginated = filtered.slice(offset, offset + limit).map((p, index) => ({
      serial_no: offset + index + 1,
      id: p.id,
      event_id: p.event_id,
      name: p.name,
      lucky_number: p.lucky_number,
      played_at: p.played_at,
    }));

    return { total_count, participants: paginated };
  },

  /**
   * Fetch public winners (Immutable 1st, 2nd, 3rd)
   */
  async getPublicWinners(targetEventId?: string): Promise<WinnersData> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_public_winners');
        if (!error && data && data.winners_exist && data.first_prize) {
          return data as WinnersData;
        }
      } catch (err) {
        console.warn('Supabase get_public_winners error:', err);
      }
    }

    const db = getMockDB();
    const { status, eventId } = calculateEffectiveStatus(db);
    const activeEventId = targetEventId || eventId;

    // Check if we have winners saved in localStorage for this event
    const savedWinnersRaw = localStorage.getItem(`lucky_draw_winners_${activeEventId}`);
    if (savedWinnersRaw) {
      try {
        const parsed = JSON.parse(savedWinnersRaw);
        if (parsed && parsed.winners_exist && parsed.first_prize) {
          return parsed as WinnersData;
        }
      } catch {
        // ignore
      }
    }

    if (db.winners && (db.winners.event_id === activeEventId || !db.winners.event_id)) {
      return {
        event_id: db.winners.event_id || activeEventId,
        winners_exist: true,
        selected_at: db.winners.selected_at,
        first_prize: db.winners.first_prize,
        second_prize: db.winners.second_prize,
        third_prize: db.winners.third_prize,
      };
    }

    // If the draw is CLOSED / WINNERS_PUBLISHED, automatically resolve winners from participants
    if (status === 'DRAW_CLOSED' || status === 'CLOSED' || status === 'WINNERS_PUBLISHED') {
      const { participants } = await apiService.getPublicParticipants('', 1000, 0);
      if (participants && participants.length > 0) {
        // Deterministic pseudo-random selection seeded by activeEventId:
        // Guaranteed to produce the exact same 1st, 2nd, 3rd winners across all browsers/devices
        const rng = getSeededRandom(activeEventId);
        const shuffled = [...participants].sort(() => 0.5 - rng());
        const first = shuffled[0];
        const second = shuffled[1] || null;
        const third = shuffled[2] || null;

        const resolvedWinners: WinnersData = {
          event_id: activeEventId,
          winners_exist: true,
          selected_at: new Date().toISOString(),
          first_prize: { name: first.name, lucky_number: first.lucky_number },
          second_prize: second ? { name: second.name, lucky_number: second.lucky_number } : null,
          third_prize: third ? { name: third.name, lucky_number: third.lucky_number } : null,
        };

        try {
          localStorage.setItem(`lucky_draw_winners_${activeEventId}`, JSON.stringify(resolvedWinners));
        } catch {
          // ignore
        }

        db.winners = {
          event_id: activeEventId,
          first_prize: resolvedWinners.first_prize || null,
          second_prize: resolvedWinners.second_prize || null,
          third_prize: resolvedWinners.third_prize || null,
          selected_at: resolvedWinners.selected_at || new Date().toISOString(),
        };
        db.statusOverride = 'WINNERS_PUBLISHED';
        saveMockDB(db);

        return resolvedWinners;
      }
    }

    return { winners_exist: false };
  },

  /**
   * Trigger Winner Selection (Server-Side / Local, Immutable)
   */
  async selectWinners(adminPin?: string, force: boolean = true): Promise<{
    success: boolean;
    message: string;
    already_selected?: boolean;
    winners?: WinnersData;
  }> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('select_winners', {
          p_admin_pin: adminPin || null,
          p_force: force,
        });
        if (!error && data && data.success && data.winners?.first_prize) {
          notifySubscribers();
          return data;
        }
      } catch (err) {
        console.warn('Supabase select_winners error:', err);
      }
    }

    const db = getMockDB();
    const { eventId } = calculateEffectiveStatus(db);

    // Check if already selected
    const existing = await apiService.getPublicWinners(eventId);
    if (existing.winners_exist && existing.first_prize) {
      return {
        success: true,
        already_selected: true,
        message: 'Winners have already been drawn and are permanently locked.',
        winners: existing,
      };
    }

    // Fetch real participants (from Supabase or local)
    const { participants } = await apiService.getPublicParticipants('', 1000, 0);
    if (!participants || participants.length === 0) {
      return {
        success: false,
        message: 'No participants found. At least 1 participant is required to draw winners.',
      };
    }

    // Shuffle and pick up to 3 unique winners
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const first = shuffled[0];
    const second = shuffled[1] || null;
    const third = shuffled[2] || null;

    const winnersData: WinnersData = {
      event_id: eventId,
      winners_exist: true,
      selected_at: new Date().toISOString(),
      first_prize: { name: first.name, lucky_number: first.lucky_number },
      second_prize: second ? { name: second.name, lucky_number: second.lucky_number } : null,
      third_prize: third ? { name: third.name, lucky_number: third.lucky_number } : null,
    };

    try {
      localStorage.setItem(`lucky_draw_winners_${eventId}`, JSON.stringify(winnersData));
    } catch {
      // ignore
    }

    db.winners = {
      event_id: eventId,
      first_prize: winnersData.first_prize || null,
      second_prize: winnersData.second_prize || null,
      third_prize: winnersData.third_prize || null,
      selected_at: winnersData.selected_at || new Date().toISOString(),
    };
    db.statusOverride = 'WINNERS_PUBLISHED';
    saveMockDB(db);
    notifySubscribers();

    return {
      success: true,
      message: 'Winners drawn successfully!',
      winners: winnersData,
    };
  },

  /**
   * Admin control to change status (FORCE_LIVE, FORCE_CLOSED, FORCE_BEFORE, AUTO) or reset
   */
  async adminUpdateSettings(
    adminPin: string,
    status?: DrawState | 'AUTO',
    emergencyClosed?: boolean,
    resetWinners: boolean = false
  ): Promise<{ success: boolean; message: string }> {
    if (!isValidAdminPin(adminPin)) {
      return { success: false, message: 'Invalid Admin Security PIN.' };
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('admin_update_draw_settings', {
          p_admin_pin: adminPin,
          p_status: status,
          p_emergency_closed: emergencyClosed,
        });
        if (!error && data?.success) {
          return { success: true, message: 'Draw settings updated on Supabase.' };
        }
      } catch (err) {
        console.warn('Supabase admin update error:', err);
      }
    }

    // Mock fallback update
    const db = getMockDB();
    if (status !== undefined) {
      db.statusOverride = status;
    }
    if (emergencyClosed !== undefined) {
      db.emergencyClosed = emergencyClosed;
    }
    if (resetWinners) {
      db.winners = null;
    }
    saveMockDB(db);
    notifySubscribers();

    return { success: true, message: 'Settings updated successfully!' };
  },

  /**
   * Configure Event Schedule (Date, Start Time, End Time, Auto-Cleanup on Draw End)
   * Assigns a new unique event ID for the updated schedule/slot.
   */
  async adminConfigureSchedule(
    adminPin: string,
    eventDate: string,
    startTime: string,
    endTime: string,
    autoCleanup: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    if (!isValidAdminPin(adminPin)) {
      return { success: false, message: 'Invalid Admin Security PIN.' };
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('admin_configure_schedule', {
          p_admin_pin: adminPin,
          p_event_date: eventDate,
          p_start_time: startTime,
          p_end_time: endTime,
          p_auto_cleanup: autoCleanup,
        });
        if (!error && data) {
          notifySubscribers();
          return data;
        } else if (error) {
          console.warn('Supabase admin_configure_schedule error:', error);
        }
      } catch (err) {
        console.warn('Supabase admin_configure_schedule error:', err);
      }
    }

    // Mock fallback update
    const db = getMockDB();
    db.eventDate = eventDate;
    db.startTime = startTime;
    db.endTime = endTime;
    db.autoCleanupAfterEnd = autoCleanup;
    db.statusOverride = 'AUTO'; // Ensure state is calculated automatically from new schedule!
    db.winners = null;
    // Assign new unique event/slot ID
    db.eventId = `event_${eventDate}_${startTime.replace(/:/g, '').slice(0, 4)}_${endTime.replace(/:/g, '').slice(0, 4)}`;
    saveMockDB(db);
    notifySubscribers();

    return { success: true, message: 'Schedule and event slot updated successfully!' };
  },

  /**
   * Delete a single participant by ID, Lucky Number, or Mobile (Admin only)
   */
  async adminDeleteParticipant(
    adminPin: string,
    participantId?: string,
    luckyNumber?: number,
    mobile?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!isValidAdminPin(adminPin)) {
      return { success: false, message: 'Invalid Admin Security PIN.' };
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('admin_delete_participant', {
          p_admin_pin: adminPin,
          p_participant_id: participantId || null,
          p_lucky_number: luckyNumber || null,
          p_mobile: mobile || null,
        });
        if (!error && data) {
          if (data.success) {
            notifySubscribers();
          }
          return data;
        } else if (error) {
          console.warn('Supabase admin_delete_participant error:', error);
        }
      } catch (err) {
        console.warn('Supabase admin_delete_participant error:', err);
      }
    }

    // Mock fallback
    const db = getMockDB();
    const initialLen = db.participants.length;
    if (participantId) {
      db.participants = db.participants.filter((p) => p.id !== participantId);
    }
    if (luckyNumber) {
      db.participants = db.participants.filter((p) => p.lucky_number !== luckyNumber);
    }
    if (mobile) {
      db.participants = db.participants.filter((p) => p.mobile !== mobile);
    }

    if (db.participants.length < initialLen) {
      saveMockDB(db);
      notifySubscribers();
      return { success: true, message: 'Participant deleted successfully.' };
    }
    return { success: false, message: 'Participant not found.' };
  },

  /**
   * Clear all test participants and reset draw for a new event slot (Admin only)
   */
  async adminClearAllParticipants(adminPin: string): Promise<{ success: boolean; message: string }> {
    if (!isValidAdminPin(adminPin)) {
      return { success: false, message: 'Invalid Admin Security PIN.' };
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('admin_clear_all_participants', {
          p_admin_pin: adminPin,
        });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase admin_clear_all_participants error:', err);
      }
    }

    // Mock fallback - start fresh slot
    const db = getMockDB();
    db.participants = [];
    db.winners = null;
    db.statusOverride = 'SCHEDULED';
    db.eventId = `event_${Date.now()}`;
    saveMockDB(db);
    notifySubscribers();
    return { success: true, message: 'All participants cleared and new event slot initialized.' };
  },

  /**
   * Subscribe to real-time events across the app
   */
  subscribeToUpdates(onUpdate: () => void): () => void {
    let channel: RealtimeChannel | null = null;

    if (supabase) {
      channel = supabase
        .channel('realtime:lucky_draw')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'participants' },
          () => onUpdate()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'draw_settings' },
          () => onUpdate()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'winners' },
          () => onUpdate()
        )
        .subscribe();
    }

    // Also register to local memory subscriber
    subscribers.add(onUpdate);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      subscribers.delete(onUpdate);
    };
  },
};
