-- ==============================================================================
-- DADA'S BIRTHDAY — LIVE LUCKY DRAW WEB APPLICATION
-- Production Database Schema, Migrations, Functions & Row Level Security (RLS)
-- Official Event Timezone: Asia/Kolkata
-- Event Window: 25 October, 8:00 PM IST (20:00:00) to 9:00 PM IST (21:00:00)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DROP EXISTING OBJECTS (for clean idempotent migration)
DROP VIEW IF EXISTS public_participants CASCADE;
DROP VIEW IF EXISTS public_winners CASCADE;
DROP TABLE IF EXISTS winners CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS draw_settings CASCADE;

-- 2. CREATE DRAW SETTINGS TABLE
CREATE TABLE draw_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date DATE NOT NULL DEFAULT '2026-10-25',
    start_time TIME NOT NULL DEFAULT '20:00:00',
    end_time TIME NOT NULL DEFAULT '21:00:00',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    status TEXT NOT NULL DEFAULT 'AUTO' CHECK (status IN ('AUTO', 'FORCE_BEFORE', 'FORCE_LIVE', 'FORCE_CLOSED', 'WINNERS_PUBLISHED')),
    allow_manual_override BOOLEAN NOT NULL DEFAULT false,
    emergency_closed BOOLEAN NOT NULL DEFAULT false,
    admin_pin_hash TEXT NOT NULL DEFAULT crypt('dada2026', gen_salt('bf')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial draw settings
INSERT INTO draw_settings (event_date, start_time, end_time, timezone, status)
VALUES ('2026-10-25', '20:00:00', '21:00:00', 'Asia/Kolkata', 'AUTO');

-- 3. CREATE PARTICIPANTS TABLE
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 100),
    mobile TEXT NOT NULL CHECK (mobile ~ '^[6-9][0-9]{9}$'),
    lucky_number INTEGER NOT NULL CHECK (lucky_number >= 10000 AND lucky_number <= 99999),
    played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_participants_mobile UNIQUE (mobile),
    CONSTRAINT uq_participants_lucky_number UNIQUE (lucky_number)
);

-- Indexes for maximum query performance
CREATE INDEX idx_participants_mobile ON participants(mobile);
CREATE INDEX idx_participants_lucky_number ON participants(lucky_number);
CREATE INDEX idx_participants_played_at ON participants(played_at DESC);
CREATE INDEX idx_participants_created_at ON participants(created_at ASC);

-- 4. CREATE WINNERS TABLE
CREATE TABLE winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_prize_participant_id UUID REFERENCES participants(id) ON DELETE RESTRICT,
    second_prize_participant_id UUID REFERENCES participants(id) ON DELETE RESTRICT,
    third_prize_participant_id UUID REFERENCES participants(id) ON DELETE RESTRICT,
    first_prize_number INTEGER NOT NULL,
    second_prize_number INTEGER,
    third_prize_number INTEGER,
    is_published BOOLEAN NOT NULL DEFAULT true,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT single_winner_row CHECK (id IS NOT NULL)
);

-- Ensure only one winner draw record can ever exist
CREATE UNIQUE INDEX idx_single_winner_draw ON winners ((true));

-- 5. CREATE SAFE PUBLIC VIEWS (Never exposes mobile numbers)
CREATE OR REPLACE VIEW public_participants AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY p.played_at ASC) AS serial_no,
    p.id,
    p.name,
    p.lucky_number,
    p.played_at,
    p.created_at
FROM participants p;

CREATE OR REPLACE VIEW public_winners AS
SELECT 
    w.id AS winner_draw_id,
    w.selected_at,
    w.is_published,
    p1.name AS first_prize_name,
    w.first_prize_number,
    p2.name AS second_prize_name,
    w.second_prize_number,
    p3.name AS third_prize_name,
    w.third_prize_number
FROM winners w
LEFT JOIN participants p1 ON w.first_prize_participant_id = p1.id
LEFT JOIN participants p2 ON w.second_prize_participant_id = p2.id
LEFT JOIN participants p3 ON w.third_prize_participant_id = p3.id;

-- ==============================================================================
-- 6. STORED PROCEDURES & RPC FUNCTIONS (ATOMIC & SECURITY DEFINER)
-- ==============================================================================

-- A. Helper function: Get Current Draw Status & Time (Asia/Kolkata)
CREATE OR REPLACE FUNCTION get_draw_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings RECORD;
    v_now_ist TIMESTAMPTZ;
    v_current_time TIME;
    v_current_date DATE;
    v_status TEXT;
    v_total_participants INTEGER;
    v_winners_exist BOOLEAN;
    v_response JSONB;
BEGIN
    SELECT * INTO v_settings FROM draw_settings LIMIT 1;
    
    -- Convert current server UTC time to Asia/Kolkata timezone
    v_now_ist := (now() AT TIME ZONE 'Asia/Kolkata');
    v_current_time := v_now_ist::TIME;
    v_current_date := v_now_ist::DATE;

    SELECT COUNT(*) INTO v_total_participants FROM participants;
    SELECT EXISTS(SELECT 1 FROM winners) INTO v_winners_exist;

    -- Evaluate effective status
    IF v_settings.emergency_closed THEN
        v_status := 'DRAW_CLOSED';
    ELSIF v_winners_exist THEN
        v_status := 'WINNERS_PUBLISHED';
    ELSIF v_settings.status = 'FORCE_BEFORE' THEN
        v_status := 'BEFORE_DRAW';
    ELSIF v_settings.status = 'FORCE_LIVE' THEN
        v_status := 'LIVE_DRAW';
    ELSIF v_settings.status = 'FORCE_CLOSED' THEN
        v_status := 'DRAW_CLOSED';
    ELSE
        -- Automated time-based evaluation
        IF v_current_date < v_settings.event_date THEN
            v_status := 'BEFORE_DRAW';
        ELSIF v_current_date > v_settings.event_date THEN
            v_status := 'DRAW_CLOSED';
        ELSE
            IF v_current_time < v_settings.start_time THEN
                v_status := 'BEFORE_DRAW';
            ELSIF v_current_time >= v_settings.start_time AND v_current_time < v_settings.end_time THEN
                v_status := 'LIVE_DRAW';
            ELSE
                v_status := 'DRAW_CLOSED';
            END IF;
        END IF;
    END IF;

    v_response := jsonb_build_object(
        'status', v_status,
        'server_time_ist', v_now_ist,
        'event_date', v_settings.event_date,
        'start_time', v_settings.start_time,
        'end_time', v_settings.end_time,
        'timezone', v_settings.timezone,
        'total_participants', v_total_participants,
        'winners_selected', v_winners_exist,
        'emergency_closed', v_settings.emergency_closed,
        'manual_override', v_settings.status
    );

    RETURN v_response;
END;
$$;

-- B. Atomic Participant Registration Function (One mobile = One entry, Server generated 5-digit number)
CREATE OR REPLACE FUNCTION participate(p_name TEXT, p_mobile TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_name TEXT;
    v_clean_mobile TEXT;
    v_draw_status JSONB;
    v_current_state TEXT;
    v_existing_participant RECORD;
    v_lucky_number INTEGER;
    v_inserted_id UUID;
    v_inserted_played_at TIMESTAMPTZ;
    v_attempts INTEGER := 0;
    v_max_attempts INTEGER := 100;
    v_success BOOLEAN := false;
BEGIN
    -- 1. Sanitize & validate Name
    v_clean_name := trim(regexp_replace(COALESCE(p_name, ''), '\s+', ' ', 'g'));
    IF char_length(v_clean_name) < 2 OR char_length(v_clean_name) > 80 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_NAME',
            'message', 'Please enter a valid full name between 2 and 80 characters.'
        );
    END IF;

    -- 2. Normalize & validate Indian Mobile Number (10 digits starting with 6-9)
    -- Remove any spaces, dashes, +91 or leading 0
    v_clean_mobile := regexp_replace(COALESCE(p_mobile, ''), '[^0-9]', '', 'g');
    IF v_clean_mobile ~ '^91[6-9][0-9]{9}$' THEN
        v_clean_mobile := substr(v_clean_mobile, 3);
    ELSIF v_clean_mobile ~ '^0[6-9][0-9]{9}$' THEN
        v_clean_mobile := substr(v_clean_mobile, 2);
    END IF;

    IF NOT (v_clean_mobile ~ '^[6-9][0-9]{9}$') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_MOBILE',
            'message', 'Please enter a valid 10-digit Indian mobile number.'
        );
    END IF;

    -- 3. Check Event Window Authority
    v_draw_status := get_draw_status();
    v_current_state := v_draw_status->>'status';

    IF v_current_state = 'BEFORE_DRAW' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_STARTED',
            'message', 'Lucky draw has not started yet. Participation opens at 8:00 PM IST.'
        );
    ELSIF v_current_state = 'DRAW_CLOSED' OR v_current_state = 'WINNERS_PUBLISHED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DRAW_CLOSED',
            'message', 'Lucky draw is closed. Entries closed at 9:00 PM IST.'
        );
    END IF;

    -- 4. Check If Mobile Already Participated (Idempotency check)
    SELECT * INTO v_existing_participant FROM participants WHERE mobile = v_clean_mobile;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_registered', true,
            'participant', jsonb_build_object(
                'id', v_existing_participant.id,
                'name', v_existing_participant.name,
                'lucky_number', v_existing_participant.lucky_number,
                'played_at', v_existing_participant.played_at
            ),
            'message', 'You have already participated! Here is your official lucky number.'
        );
    END IF;

    -- 5. Generate Unique 5-digit Lucky Number (10000 - 99999) with collision retry
    LOOP
        v_attempts := v_attempts + 1;
        -- Generate random number between 10000 and 99999 inclusive
        v_lucky_number := floor(10000 + random() * 90000)::INTEGER;

        BEGIN
            INSERT INTO participants (name, mobile, lucky_number, played_at)
            VALUES (v_clean_name, v_clean_mobile, v_lucky_number, now())
            RETURNING id, played_at INTO v_inserted_id, v_inserted_played_at;

            v_success := true;
            EXIT; -- Successfully inserted
        EXCEPTION
            WHEN unique_violation THEN
                -- If mobile was inserted concurrently by another request
                SELECT * INTO v_existing_participant FROM participants WHERE mobile = v_clean_mobile;
                IF FOUND THEN
                    RETURN jsonb_build_object(
                        'success', true,
                        'already_registered', true,
                        'participant', jsonb_build_object(
                            'id', v_existing_participant.id,
                            'name', v_existing_participant.name,
                            'lucky_number', v_existing_participant.lucky_number,
                            'played_at', v_existing_participant.played_at
                        ),
                        'message', 'You have already participated! Here is your official lucky number.'
                    );
                END IF;
                -- If it was a lucky_number collision, loop and retry
                IF v_attempts >= v_max_attempts THEN
                    RAISE EXCEPTION 'Could not allocate unique lucky number after % attempts', v_max_attempts;
                END IF;
        END;
    END LOOP;

    IF v_success THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_registered', false,
            'participant', jsonb_build_object(
                'id', v_inserted_id,
                'name', v_clean_name,
                'lucky_number', v_lucky_number,
                'played_at', v_inserted_played_at
            ),
            'message', 'Congratulations! Your lucky number has been generated.'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'code', 'SERVER_ERROR',
            'message', 'An unexpected error occurred. Please try again.'
        );
    END IF;
END;
$$;

-- C. Winner Selection Function (Server-Side, Immutable, Exactly 3 unique winners)
CREATE OR REPLACE FUNCTION select_winners(p_admin_pin TEXT DEFAULT NULL, p_force BOOLEAN DEFAULT false)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings RECORD;
    v_existing_winners RECORD;
    v_draw_status JSONB;
    v_status TEXT;
    v_total_participants INTEGER;
    v_winners_records RECORD;
    v_p1 RECORD;
    v_p2 RECORD;
    v_p3 RECORD;
    v_winner_id UUID;
BEGIN
    -- 1. Check If Winners Already Exist (IMMUTABILITY RULE)
    SELECT * INTO v_existing_winners FROM winners LIMIT 1;
    IF FOUND THEN
        -- Fetch names of existing winners
        SELECT 
            w.id,
            w.selected_at,
            w.is_published,
            w.first_prize_number,
            p1.name AS first_prize_name,
            w.second_prize_number,
            p2.name AS second_prize_name,
            w.third_prize_number,
            p3.name AS third_prize_name
        INTO v_winners_records
        FROM winners w
        LEFT JOIN participants p1 ON w.first_prize_participant_id = p1.id
        LEFT JOIN participants p2 ON w.second_prize_participant_id = p2.id
        LEFT JOIN participants p3 ON w.third_prize_participant_id = p3.id
        LIMIT 1;

        RETURN jsonb_build_object(
            'success', true,
            'already_selected', true,
            'message', 'Winners have already been drawn and are permanently locked.',
            'winners', jsonb_build_object(
                'first_prize', jsonb_build_object('name', v_winners_records.first_prize_name, 'lucky_number', v_winners_records.first_prize_number),
                'second_prize', jsonb_build_object('name', v_winners_records.second_prize_name, 'lucky_number', v_winners_records.second_prize_number),
                'third_prize', jsonb_build_object('name', v_winners_records.third_prize_name, 'lucky_number', v_winners_records.third_prize_number),
                'selected_at', v_winners_records.selected_at
            )
        );
    END IF;

    -- 2. Verify Draw Closure / Authority
    SELECT * INTO v_settings FROM draw_settings LIMIT 1;
    v_draw_status := get_draw_status();
    v_status := v_draw_status->>'status';

    -- Admin PIN check if provided or if required
    IF p_admin_pin IS NOT NULL AND crypt(p_admin_pin, v_settings.admin_pin_hash) != v_settings.admin_pin_hash THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'UNAUTHORIZED',
            'message', 'Invalid admin authentication credentials.'
        );
    END IF;

    IF v_status != 'DRAW_CLOSED' AND v_status != 'WINNERS_PUBLISHED' AND NOT p_force THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DRAW_NOT_CLOSED',
            'message', 'Winners can only be selected after participation closes at 9:00 PM IST.'
        );
    END IF;

    -- 3. Check Participant Count
    SELECT COUNT(*) INTO v_total_participants FROM participants;
    IF v_total_participants = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'NO_PARTICIPANTS',
            'message', 'No participants have joined the draw yet. Cannot select winners.'
        );
    END IF;

    -- 4. Select Random Distinct Real Participants
    -- 1st Prize
    SELECT * INTO v_p1 FROM participants ORDER BY random() LIMIT 1;
    
    -- 2nd Prize (different participant)
    SELECT * INTO v_p2 FROM participants WHERE id != v_p1.id ORDER BY random() LIMIT 1;

    -- 3rd Prize (different from 1st and 2nd)
    IF v_p2.id IS NOT NULL THEN
        SELECT * INTO v_p3 FROM participants WHERE id NOT IN (v_p1.id, v_p2.id) ORDER BY random() LIMIT 1;
    END IF;

    -- 5. Insert Winners Record Atomically
    INSERT INTO winners (
        first_prize_participant_id,
        second_prize_participant_id,
        third_prize_participant_id,
        first_prize_number,
        second_prize_number,
        third_prize_number,
        selected_at
    ) VALUES (
        v_p1.id,
        v_p2.id,
        v_p3.id,
        v_p1.lucky_number,
        v_p2.lucky_number,
        v_p3.lucky_number,
        now()
    ) RETURNING id INTO v_winner_id;

    -- Update status in draw settings
    UPDATE draw_settings SET status = 'WINNERS_PUBLISHED', updated_at = now();

    RETURN jsonb_build_object(
        'success', true,
        'already_selected', false,
        'message', 'Winners have been successfully drawn and permanently recorded!',
        'total_participants', v_total_participants,
        'winners', jsonb_build_object(
            'first_prize', jsonb_build_object('name', v_p1.name, 'lucky_number', v_p1.lucky_number),
            'second_prize', CASE WHEN v_p2.id IS NOT NULL THEN jsonb_build_object('name', v_p2.name, 'lucky_number', v_p2.lucky_number) ELSE NULL END,
            'third_prize', CASE WHEN v_p3.id IS NOT NULL THEN jsonb_build_object('name', v_p3.name, 'lucky_number', v_p3.lucky_number) ELSE NULL END,
            'selected_at', now()
        )
    );
END;
$$;

-- D. Admin Update Draw Settings Function
CREATE OR REPLACE FUNCTION admin_update_draw_settings(
    p_admin_pin TEXT,
    p_status TEXT DEFAULT NULL,
    p_emergency_closed BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings RECORD;
BEGIN
    SELECT * INTO v_settings FROM draw_settings LIMIT 1;
    IF crypt(p_admin_pin, v_settings.admin_pin_hash) != v_settings.admin_pin_hash THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized. Incorrect admin PIN.');
    END IF;

    UPDATE draw_settings
    SET 
        status = COALESCE(p_status, status),
        emergency_closed = COALESCE(p_emergency_closed, emergency_closed),
        updated_at = now();

    RETURN jsonb_build_object('success', true, 'message', 'Draw settings updated successfully.');
END;
$$;

-- E. Public Participant Query Function (Safe pagination and searching, NO mobile numbers)
CREATE OR REPLACE FUNCTION get_public_participants(
    p_search TEXT DEFAULT '',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_search TEXT;
    v_total_filtered INTEGER;
    v_list JSONB;
BEGIN
    v_clean_search := trim(COALESCE(p_search, ''));

    IF v_clean_search = '' THEN
        SELECT COUNT(*) INTO v_total_filtered FROM participants;
        
        SELECT jsonb_agg(
            jsonb_build_object(
                'serial_no', sub.serial_no,
                'name', sub.name,
                'lucky_number', sub.lucky_number,
                'played_at', sub.played_at
            )
        ) INTO v_list
        FROM (
            SELECT 
                ROW_NUMBER() OVER (ORDER BY played_at ASC) as serial_no,
                name,
                lucky_number,
                played_at
            FROM participants
            ORDER BY played_at ASC
            LIMIT p_limit OFFSET p_offset
        ) sub;
    ELSE
        SELECT COUNT(*) INTO v_total_filtered 
        FROM participants 
        WHERE name ILIKE '%' || v_clean_search || '%' 
           OR lucky_number::TEXT ILIKE '%' || v_clean_search || '%';

        SELECT jsonb_agg(
            jsonb_build_object(
                'serial_no', sub.serial_no,
                'name', sub.name,
                'lucky_number', sub.lucky_number,
                'played_at', sub.played_at
            )
        ) INTO v_list
        FROM (
            SELECT 
                ROW_NUMBER() OVER (ORDER BY played_at ASC) as serial_no,
                name,
                lucky_number,
                played_at
            FROM participants
            WHERE name ILIKE '%' || v_clean_search || '%' 
               OR lucky_number::TEXT ILIKE '%' || v_clean_search || '%'
            ORDER BY played_at ASC
            LIMIT p_limit OFFSET p_offset
        ) sub;
    END IF;

    RETURN jsonb_build_object(
        'total_count', COALESCE(v_total_filtered, 0),
        'participants', COALESCE(v_list, '[]'::jsonb)
    );
END;
$$;

-- F. Public Winner Fetch Function
CREATE OR REPLACE FUNCTION get_public_winners()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_winners RECORD;
BEGIN
    SELECT 
        w.id,
        w.selected_at,
        w.is_published,
        p1.name AS first_prize_name,
        w.first_prize_number,
        p2.name AS second_prize_name,
        w.second_prize_number,
        p3.name AS third_prize_name,
        w.third_prize_number
    INTO v_winners
    FROM winners w
    LEFT JOIN participants p1 ON w.first_prize_participant_id = p1.id
    LEFT JOIN participants p2 ON w.second_prize_participant_id = p2.id
    LEFT JOIN participants p3 ON w.third_prize_participant_id = p3.id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('winners_exist', false);
    END IF;

    RETURN jsonb_build_object(
        'winners_exist', true,
        'selected_at', v_winners.selected_at,
        'first_prize', jsonb_build_object('name', v_winners.first_prize_name, 'lucky_number', v_winners.first_prize_number),
        'second_prize', CASE WHEN v_winners.second_prize_number IS NOT NULL THEN jsonb_build_object('name', v_winners.second_prize_name, 'lucky_number', v_winners.second_prize_number) ELSE NULL END,
        'third_prize', CASE WHEN v_winners.third_prize_number IS NOT NULL THEN jsonb_build_object('name', v_winners.third_prize_name, 'lucky_number', v_winners.third_prize_number) ELSE NULL END
    );
END;
$$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- Draw settings: public can read non-sensitive fields
CREATE POLICY "Public can view draw settings" ON draw_settings
    FOR SELECT USING (true);

-- Winners: public can read published winners
CREATE POLICY "Public can view winners" ON winners
    FOR SELECT USING (is_published = true);

-- Participants table: 
-- Public cannot perform direct INSERT, UPDATE, DELETE (must use participate() RPC)
-- Direct SELECT only allows reading safe fields via RPC or View.
CREATE POLICY "No direct public insert on participants" ON participants
    FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct public update on participants" ON participants
    FOR UPDATE USING (false);

CREATE POLICY "No direct public delete on participants" ON participants
    FOR DELETE USING (false);

-- Enable Realtime publications on tables for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE winners;
ALTER PUBLICATION supabase_realtime ADD TABLE draw_settings;
