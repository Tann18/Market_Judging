# Financial Market Arena — Real-Time Multi-Room Simulation Platform

A real-time financial market competition platform built with Next.js 16 (App Router, Turbopack), Tailwind CSS, Lucide icons, and Supabase PostgreSQL with WebSockets. Designed for live multi-room competitions, hackathons, and pitch battles.

---

## 🏛 Platform Architecture

The system coordinates 3 key operational viewpoints in real-time:

1. **Projector Arena Display (`/display`)**
   - Live ticker tape and 20-company stock exchange board.
   - Head-to-head match cards with live sparkline history.
   - Dynamic leaderboard ranked by current market valuation and percentage gain.
   - Indian Rupee (`₹` / INR) native currency denomination.

2. **Judge Handheld Remote (`/judge`)**
   - PIN-protected seat authentication (12 seats across 4 rooms).
   - Dedicated Bullish / Bearish rating triggers for competing teams.
   - Real-time room status awareness (`LIVE`, `PAUSED`, `LOCKED`).

3. **Organiser Control Room (`/admin`)**
   - Protected console with live room orchestration (`START ALL`, `PAUSE ALL`, `LOCK ALL`).
   - Matchup assigner for pairing companies in Rooms 1–4 with variable price steps (±₹1, ±₹2, ±₹5, ±₹10).
   - **Companies & Valuations Directory**: Rename companies, change tickers, adjust base starting valuations, or manually override live stock prices.
   - Inline quick-adjust price buttons (`-₹5`, `-₹1`, `+₹1`, `+₹5`).
   - Audit trail feed with instant filtering and CSV export.
   - Audit log clearing and full market reset controls.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory (refer to `.env.example`):

```env
# Admin Master Password for Organiser Access
ADMIN_PASSWORD=admin123

# Supabase Realtime Multi-Device Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Schema
Execute the SQL statements located in [`supabase/schema.sql`](./supabase/schema.sql) in your Supabase SQL Editor. This initializes:
- `companies`, `rooms`, `judges`, and `vote_logs` tables.
- Row Level Security (RLS) policies.
- Realtime publication `supabase_realtime` for live multi-device streaming.
- Atomic PostgreSQL stored procedures (`submit_vote`, `reset_market`).

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Home Hub.

---

## ☁️ Deployment (Vercel)

1. Push this repository to GitHub.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. In **Project Settings** → **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`
4. Click **Deploy**. Your app is now live and synced worldwide across all devices.
