import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { DrawSettings, DrawState, Participant, ParticipationResult, WinnersData } from '../types';
import { parseISTDate } from '../utils/time';

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

const STORAGE_KEY = 'lucky_draw_db_v3';

function getMockDB(): MockStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse error
  }

  // Default test schedule: 9:00 AM (09:00) to 11:59 PM (23:59) IST
  const eventDate = '2026-10-09';
  const startTime = '09:00:00';
  const endTime = '23:59:00';
  const eventId = `event_${eventDate}_${startTime.slice(0, 2)}${startTime.slice(3, 5)}`;

  const initial: MockStorage = {
    eventId,
    participants: [
      { id: '1', event_id: eventId, name: 'Aarav Sharma', mobile: '9876543210', lucky_number: 38472, played_at: new Date(Date.now() - 3600000).toISOString(), created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: '2', event_id: eventId, name: 'Priya Mukherjee', mobile: '9876543211', lucky_number: 81924, played_at: new Date(Date.now() - 2800000).toISOString(), created_at: new Date(Date.now() - 2800000).toISOString() },
      { id: '3', event_id: eventId, name: 'Rohan Sen', mobile: '9876543212', lucky_number: 15683, played_at: new Date(Date.now() - 1900000).toISOString(), created_at: new Date(Date.now() - 1900000).toISOString() },
      { id: '4', event_id: eventId, name: 'Sneha Bose', mobile: '9876543213', lucky_number: 62419, played_at: new Date(Date.now() - 1200000).toISOString(), created_at: new Date(Date.now() - 1200000).toISOString() },
      { id: '5', event_id: eventId, name: 'Debabrata Das', mobile: '9876543214', lucky_number: 94017, played_at: new Date(Date.now() - 500000).toISOString(), created_at: new Date(Date.now() - 500000).toISOString() },
    ],
    winners: null,
    statusOverride: 'LIVE_DRAW',
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

// ==============================================================================
// PUBLIC BACKEND API INTERFACE
// ==============================================================================

export const apiService = {
  /**
   * Fetch current draw status, settings, total participants, and IST server time
   */
  async getDrawStatus(): Promise<DrawSettings> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_draw_status');
        if (!error && data) {
          const eventDate = data.event_date || '2026-10-09';
          const startTime = data.start_time || '09:00:00';
          const endTime = data.end_time || '20:00:00';
          const eventId = data.event_id || `event_${eventDate}_${startTime.replace(/:/g, '').slice(0, 4)}_${endTime.replace(/:/g, '').slice(0, 4)}`;

          return {
            event_id: eventId,
            event_date: eventDate,
            start_time: startTime,
            end_time: endTime,
            timezone: data.timezone || 'Asia/Kolkata',
            status: data.status as DrawState,
            server_time_ist: data.server_time_ist || new Date().toISOString(),
            total_participants: data.total_participants || 0,
            winners_selected: Boolean(data.winners_selected),
            emergency_closed: Boolean(data.emergency_closed),
            auto_cleanup_after_end: data.auto_cleanup_after_end ?? true,
            manual_override: data.manual_override,
          };
        }
      } catch (err) {
        console.warn('Supabase get_draw_status error, falling back to local state:', err);
      }
    }

    // Mock fallback
    const db = getMockDB();
    const eventDate = db.eventDate || '2026-10-09';
    const startTime = db.startTime || '09:00:00';
    const endTime = db.endTime || '23:59:00';
    const autoCleanup = db.autoCleanupAfterEnd ?? true;
    const eventId = db.eventId || `event_${eventDate}_${startTime.replace(/:/g, '').slice(0, 4)}_${endTime.replace(/:/g, '').slice(0, 4)}`;

    // Calculate dynamic IST date & time
    const nowIst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const curYear = nowIst.getFullYear();
    const curMonth = String(nowIst.getMonth() + 1).padStart(2, '0');
    const curDay = String(nowIst.getDate()).padStart(2, '0');
    const curDateStr = `${curYear}-${curMonth}-${curDay}`;
    const curTimeStr = `${String(nowIst.getHours()).padStart(2, '0')}:${String(nowIst.getMinutes()).padStart(2, '0')}:${String(nowIst.getSeconds()).padStart(2, '0')}`;

    // Automatic Data Cleanup: Only delete data 2 FULL HOURS after the draw end time
    const endDateTime = parseISTDate(eventDate, endTime);
    const twoHoursAfterEndMs = endDateTime.getTime() + 2 * 60 * 60 * 1000;
    const nowMs = new Date().getTime();

    if (autoCleanup && nowMs >= twoHoursAfterEndMs) {
      if (db.participants.length > 0 || db.winners) {
        db.participants = [];
        db.winners = null;
        db.statusOverride = 'SCHEDULED';
        db.eventId = `event_${Date.now()}`;
        saveMockDB(db);
        notifySubscribers();
      }
    }

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
      event_id: eventId,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      timezone: 'Asia/Kolkata',
      status: effectiveStatus,
      server_time_ist: nowIst.toISOString(),
      total_participants: db.participants.length,
      winners_selected: db.winners !== null,
      emergency_closed: db.emergencyClosed,
      auto_cleanup_after_end: autoCleanup,
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
    const eventId = db.eventId || 'current_event';

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
    const currentStatus = db.winners
      ? 'WINNERS_PUBLISHED'
      : db.emergencyClosed
      ? 'DRAW_CLOSED'
      : db.statusOverride;

    if (currentStatus === 'BEFORE_DRAW') {
      return {
        success: false,
        code: 'NOT_STARTED',
        message: 'Lucky draw has not started yet. Participation opens at 8:00 PM IST.',
      };
    }
    if (currentStatus === 'DRAW_CLOSED' || currentStatus === 'WINNERS_PUBLISHED') {
      return {
        success: false,
        code: 'DRAW_CLOSED',
        message: 'Lucky draw is closed. Entries closed at 9:00 PM IST.',
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
  async getPublicWinners(): Promise<WinnersData> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_public_winners');
        if (!error && data) {
          return data as WinnersData;
        }
      } catch (err) {
        console.warn('Supabase get_public_winners error:', err);
      }
    }

    // Mock fallback
    const db = getMockDB();
    if (!db.winners) {
      return { winners_exist: false };
    }

    return {
      event_id: db.winners.event_id,
      winners_exist: true,
      selected_at: db.winners.selected_at,
      first_prize: db.winners.first_prize,
      second_prize: db.winners.second_prize,
      third_prize: db.winners.third_prize,
    };
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
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase select_winners error:', err);
      }
    }

    // Mock fallback
    const db = getMockDB();
    if (db.winners) {
      return {
        success: true,
        already_selected: true,
        message: 'Winners have already been drawn and are permanently locked.',
        winners: {
          event_id: db.winners.event_id,
          winners_exist: true,
          selected_at: db.winners.selected_at,
          first_prize: db.winners.first_prize,
          second_prize: db.winners.second_prize,
          third_prize: db.winners.third_prize,
        },
      };
    }

    if (db.participants.length === 0) {
      return {
        success: false,
        message: 'No participants found. At least 1 participant is required to draw winners.',
      };
    }

    // Shuffle and pick up to 3 unique winners
    const shuffled = [...db.participants].sort(() => 0.5 - Math.random());
    const first = shuffled[0];
    const second = shuffled[1] || null;
    const third = shuffled[2] || null;

    db.winners = {
      event_id: db.eventId,
      first_prize: { name: first.name, lucky_number: first.lucky_number },
      second_prize: second ? { name: second.name, lucky_number: second.lucky_number } : null,
      third_prize: third ? { name: third.name, lucky_number: third.lucky_number } : null,
      selected_at: new Date().toISOString(),
    };
    db.statusOverride = 'WINNERS_PUBLISHED';
    saveMockDB(db);
    notifySubscribers();

    return {
      success: true,
      message: 'Winners drawn successfully!',
      winners: {
        event_id: db.winners.event_id,
        winners_exist: true,
        selected_at: db.winners.selected_at,
        first_prize: db.winners.first_prize,
        second_prize: db.winners.second_prize,
        third_prize: db.winners.third_prize,
      },
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
    const validPin = import.meta.env.VITE_ADMIN_PIN || 'dada2026';
    if (adminPin !== validPin) {
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
    const validPin = import.meta.env.VITE_ADMIN_PIN || 'dada2026';
    if (adminPin !== validPin) {
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
    const validPin = import.meta.env.VITE_ADMIN_PIN || 'dada2026';
    if (adminPin !== validPin) {
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
    const validPin = import.meta.env.VITE_ADMIN_PIN || 'dada2026';
    if (adminPin !== validPin) {
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
