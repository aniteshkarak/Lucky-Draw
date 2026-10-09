export type DrawState =
  | 'SCHEDULED'
  | 'LIVE'
  | 'CLOSED'
  | 'WINNERS_PUBLISHED'
  | 'BEFORE_DRAW'
  | 'LIVE_DRAW'
  | 'DRAW_CLOSED';

export interface Participant {
  serial_no: number;
  id?: string;
  event_id?: string;
  name: string;
  lucky_number: number;
  played_at: string;
  created_at?: string;
}

export interface DrawSettings {
  event_id?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  status: DrawState;
  server_time_ist: string;
  total_participants: number;
  winners_selected: boolean;
  emergency_closed: boolean;
  auto_cleanup_after_end?: boolean;
  manual_override?: string;
}

export interface WinnerPrize {
  name: string;
  lucky_number: number;
}

export interface WinnersData {
  event_id?: string;
  winners_exist: boolean;
  selected_at?: string;
  first_prize?: WinnerPrize | null;
  second_prize?: WinnerPrize | null;
  third_prize?: WinnerPrize | null;
}

export interface ParticipationResult {
  success: boolean;
  already_registered?: boolean;
  participant?: {
    id?: string;
    event_id?: string;
    name: string;
    lucky_number: number;
    played_at: string;
  };
  message: string;
  code?: string;
}

export interface LocalParticipationRecord {
  event_id: string;
  name: string;
  lucky_number: number;
  status: 'REGISTERED' | 'CONFIRMED';
  played_at: string;
}
