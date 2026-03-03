# AGENTS.md

## Cursor Cloud specific instructions

**StreamFlix** is a React + Vite video streaming prototype with a Hono-based Cloudflare Worker API and D1 database backend.

### Project structure

```
src/
  components/   # Reusable UI components (Sidebar, Navbar, VideoCard, PlayerContainer, CloudflarePlayer, etc.)
  pages/        # Route-level page components (HomePage, VideoDetailPage, TrendingPage, FavoritesPage)
  server/       # Hono Worker API (index.ts) — serves /api/videos from D1
  hooks/        # Custom React hooks (reserved for future use)
  utils/        # Utility functions (format.ts)
  types/        # TypeScript type definitions (Video interface)
  App.tsx        # Router shell with layout (Sidebar + Navbar + Routes)
  main.tsx       # Entry point with BrowserRouter
  data.ts        # Mock video data (fallback when API is unavailable)
  index.css      # Tailwind CSS entry + theme variables
wrangler.toml    # Cloudflare Worker config with D1 binding
schema.sql       # D1 database schema
seed.sql         # D1 seed data (6 sample videos)
```

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Vite dev server | `npm run dev` | 3000 | Frontend; proxies `/api` → Worker on 8787 |
| Hono Worker API | `npm run dev:api` | 8787 | Backend; reads from local D1 (SQLite) |

Both services must run simultaneously for full functionality. If only the Vite server is running, the homepage falls back to mock data and shows a yellow warning banner.

### Common commands

See `package.json` scripts for the canonical list:

- **Lint**: `npm run lint` (runs `tsc --noEmit`)
- **Build**: `npm run build` (runs `vite build`, outputs to `dist/`)
- **Frontend dev**: `npm run dev` (Vite on port 3000 with HMR)
- **Backend dev**: `npm run dev:api` (Wrangler on port 8787, local D1)
- **DB init**: `npm run db:init` (creates tables in local D1)
- **DB seed**: `npm run db:seed` (inserts 6 sample videos)
- **DB reset**: `npm run db:reset` (drops + recreates + seeds)

### Routing

Uses `react-router-dom` with `BrowserRouter`. Routes: `/` (home), `/video/:id` (detail), `/trending`, `/favorites`.

### Non-obvious notes

- The Vite dev server proxies `/api/*` requests to `localhost:8787` (configured in `vite.config.ts`). Both `npm run dev` and `npm run dev:api` must run in parallel for the API to work.
- Local D1 data is stored in `.wrangler/state/v3/d1/` as SQLite files. Run `npm run db:reset` to reinitialize.
- `wrangler.toml` has a placeholder `database_id`. For cloud deployment, run `npx wrangler d1 create streamflix_db` and update the ID.
- `CloudflarePlayer` component auto-detects real Cloudflare Stream IDs (anything not starting with `stream_`). Until real Stream IDs are configured, it falls back to HTML5 `<video>`.
- `HomePage` fetches from `/api/videos` and gracefully falls back to `MOCK_VIDEOS` if the API is unreachable.
- Several `package.json` dependencies (`express`, `better-sqlite3`, `dotenv`, `@google/genai`, `motion`) are listed but **not imported** in any source file. They are intentionally kept for future use.
- The entire UI is in Simplified Chinese.
- **No test framework** is configured in this repo.
