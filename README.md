# Dugout

A mobile-first web app for little league coaches to manage seasons, rosters, and schedules.

## Features

- **Seasons** — create and manage multiple seasons; each season is the root of all data
- **Schedule** — add games manually, import from a CSV file, or subscribe to a WebCal / .ics feed
- **Roster** — track players with jersey numbers, positions, and parent contact info
- **Overview** — per-season dashboard showing W-L record and upcoming games
- **Offline-first** — all data stored locally in the browser via localStorage; no backend required

## Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) with HMR
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zustand](https://zustand-demo.pmnd.rs) for state management + persistence
- [React Router v7](https://reactrouter.com)
- [Phosphor Icons](https://phosphoricons.com)
- [date-fns](https://date-fns.org)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The app is also accessible on your local network for mobile testing.

## Project Structure

```
src/
├── components/
│   ├── layout/       # App shell, header, nav
│   ├── seasons/      # Season form
│   └── ui/           # Button, Modal, EmptyState
├── lib/              # CSV + ICS parsers, nanoid
├── pages/
│   ├── SeasonsPage         # Season list
│   ├── SeasonDetailPage    # Tab shell (Overview / Schedule / Roster)
│   ├── SeasonOverviewPage  # Dashboard for a season
│   ├── SchedulePage        # Game management
│   └── RosterPage          # Player management
├── store/            # Zustand store with localStorage persistence
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
