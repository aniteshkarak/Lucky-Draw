# 🎉 Dada's Birthday — Live Lucky Draw Web Application

A complete, production-ready, real-time birthday lucky draw web application built for **25 October (8:00 PM – 9:00 PM IST)**.

---

## 🌟 Key Highlights & Features

1. **Event Window & Timezone Authority**:
   - Timezone: **Asia/Kolkata (`+05:30`)**.
   - Official Date: **25 October**.
   - Participation Window: **8:00 PM IST to 9:00 PM IST**.
   - Live countdown timer synchronizing with server time.
   - Server-side validation prevents entries outside the designated window.

2. **One Entry Per Mobile Number & Unique 5-Digit Number**:
   - Form accepts Full Name & 10-digit Indian mobile number (`^[6-9][0-9]{9}$`).
   - Mobile numbers are normalized (+91, leading 0, spaces, dashes removed).
   - Generates unique random 5-digit number (`10000–99999`) server-side.
   - Enforces unique database constraints (`UNIQUE(mobile)` and `UNIQUE(lucky_number)`).
   - Idempotent: If an already registered mobile submits again, it returns the existing ticket without creating duplicates.

3. **Privacy-First Public Participant Board**:
   - Displays serial number (`#`), `Name`, `Lucky Number`, and `Registration Time`.
   - **Mobile numbers are NEVER exposed** in public queries or DOM.
   - Real-time live synchronization with Supabase Realtime channel.
   - Search by Name or 5-digit Lucky Number.

4. **Server-Side Immutable Winner Selection**:
   - Only executed after draw closes (9:00 PM IST or admin trigger).
   - Selects **exactly 3 unique winners** (1st Prize 🥇, 2nd Prize 🥈, 3rd Prize 🥉) from actual participants.
   - Permanent database storage: refresh or repeated API calls return identical winners.
   - Celebration podium with rolling digit animation, confetti burst, and Web Audio API fanfare.

5. **Protected Admin Control Center**:
   - Protected by Security PIN (`dada2026` by default or Supabase Auth).
   - Live status switcher (`AUTO`, `FORCE_LIVE`, `FORCE_CLOSED`, `FORCE_BEFORE`) for testing.
   - Winner Selection trigger with safety confirmation.
   - Emergency close override.
   - One-click CSV export of participants.

6. **Web Audio API Synthesizers**:
   - Built-in sound effects (Fanfare, Chime, Click, Roll, Error) without external audio file dependencies.
   - Mute/unmute toggle persisted in localStorage.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 6, TypeScript 5, Tailwind CSS 3
- **Animations & Effects**: Framer Motion 12, Canvas Confetti
- **Sound Engine**: Web Audio API Sound Synthesizer
- **Backend & Database**: Supabase PostgreSQL + PostgreSQL Stored Procedures (RPC)
- **Realtime**: Supabase Realtime Channel (with graceful fallback polling)

---

## 🗄️ Database Architecture & Migrations

All SQL migrations are located in: [`supabase/migrations/20261025000000_init_lucky_draw.sql`](supabase/migrations/20261025000000_init_lucky_draw.sql)

### Tables:
- `participants`: UUID primary key, `name`, `mobile` (UNIQUE), `lucky_number` (UNIQUE, 10000–99999), `played_at`, `created_at`.
- `draw_settings`: Event date, start time (`20:00:00`), end time (`21:00:00`), timezone (`Asia/Kolkata`), status, emergency switch, admin PIN hash.
- `winners`: Foreign keys to participants (`1st`, `2nd`, `3rd`), `first_prize_number`, `second_prize_number`, `third_prize_number`, `selected_at`.

### Stored Procedures (RPC):
- `get_draw_status()`: Evaluates server time in Asia/Kolkata and returns draw state.
- `participate(p_name, p_mobile)`: SECURITY DEFINER atomic registration function.
- `select_winners(p_admin_pin, p_force)`: SECURITY DEFINER immutable winner selection.
- `get_public_participants(p_search, p_limit, p_offset)`: Safe public view without mobile numbers.
- `get_public_winners()`: Safe public winner view.
- `admin_update_draw_settings(p_admin_pin, p_status, p_emergency_closed)`: Admin settings update.

### Row Level Security (RLS):
- Direct public `INSERT`, `UPDATE`, and `DELETE` on `participants` are strictly disabled.
- Public reads are permitted only on sanitized views and published winners.

---

## 🚀 Quick Start & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your Supabase project credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ADMIN_PIN=dada2026
```

*(Note: If Supabase credentials are not provided, the application automatically runs on a built-in offline simulation engine for development and testing.)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

### 5. Run Backend Logic Test Suite
```bash
node tests/test_suite.mjs
```

---

## 🌐 Production Deployment Guide (Vercel)

1. Push code to GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete Dada's Birthday Lucky Draw web application"
   git push origin main
   ```
2. Import project in [Vercel](https://vercel.com).
3. Set Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PIN`
4. Deploy!
