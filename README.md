# Dugout

A mobile-first web app for little league coaches to manage seasons, rosters, and schedules.

## Features

- **Seasons** — create and manage multiple seasons; each season is the root of all data
- **Schedule** — add games manually, import from a CSV file, or subscribe to a WebCal / .ics feed
- **Roster** — track players with jersey numbers, positions, and parent contact info
- **Overview** — per-season dashboard showing W-L record and upcoming games
- **Auth** — sign in with Google or email/password; data is private per account
- **Cloud sync** — all data stored in Supabase with row-level security

## Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) with HMR
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zustand](https://zustand-demo.pmnd.rs) for state management
- [Supabase](https://supabase.com) — Postgres database, auth, and row-level security
- [React Router v7](https://reactrouter.com)
- [Phosphor Icons](https://phosphoricons.com)
- [date-fns](https://date-fns.org)

## Getting Started

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then run `supabase/schema.sql` in the SQL editor to set up the tables and RLS policies.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase project URL and anon key:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. (Optional) Enable Google OAuth

- In Google Cloud Console, create an OAuth 2.0 client and add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI
- In Supabase → Authentication → Providers → Google, enable the provider and paste in your Client ID and Secret

### 4. Run the app

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The app is also accessible on your local network for mobile testing.

## Project Structure

```
src/
├── components/
│   ├── auth/         # RequireAuth route guard
│   ├── layout/       # App shell and header
│   ├── seasons/      # Season form
│   └── ui/           # Button, Modal, EmptyState
├── lib/
│   ├── supabase.ts   # Supabase client, row types, mappers
│   ├── parseSchedule # CSV parser
│   └── parseICS      # ICS / WebCal parser
├── pages/
│   ├── AuthPage            # Sign in / sign up
│   ├── SeasonsPage         # Season list
│   ├── SeasonDetailPage    # Tab shell (Overview / Schedule / Roster)
│   ├── SeasonOverviewPage  # Dashboard for a season
│   ├── SchedulePage        # Game management
│   └── RosterPage          # Player management
├── store/
│   ├── index.ts      # App data store (async Supabase CRUD)
│   └── authStore.ts  # Auth state (session, sign in/out)
└── types/            # Shared TypeScript types
```

## Schedule Import

Games can be imported from a CSV file with flexible column headers:

| Column | Aliases |
|--------|---------|
| `date` | `gamedate`, `scheduleddate` |
| `time` | `gametime`, `starttime` |
| `opponent` | `opposingteam`, `vs`, `team` |
| `location` | `field`, `venue`, `site` |
| `home` | `ishome`, `homeaway` |

WebCal (`.ics`) feeds can be imported by URL or file upload. `webcal://` URLs are automatically converted to `https://` for fetching.
