# AGENTS.md

## Cursor Cloud specific instructions

**StreamFlix** is a React + Vite single-page video streaming prototype. No backend services are needed — the app uses mock data from `src/data.ts` with publicly hosted sample videos.

### Project structure

```
src/
  components/   # Reusable UI components (Sidebar, Navbar, VideoCard, PlayerContainer, etc.)
  pages/        # Route-level page components (HomePage, VideoDetailPage, TrendingPage, FavoritesPage)
  hooks/        # Custom React hooks (reserved for future use)
  utils/        # Utility functions (format.ts)
  types/        # TypeScript type definitions (Video interface)
  App.tsx        # Router shell with layout (Sidebar + Navbar + Routes)
  main.tsx       # Entry point with BrowserRouter
  data.ts        # Mock video data
  index.css      # Tailwind CSS entry + theme variables
```

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Vite dev server | `npm run dev` | 3000 | Only required service; binds to `0.0.0.0` |

### Common commands

See `package.json` scripts for the canonical list:

- **Lint**: `npm run lint` (runs `tsc --noEmit`)
- **Build**: `npm run build` (runs `vite build`, outputs to `dist/`)
- **Dev server**: `npm run dev` (Vite on port 3000 with HMR)
- **No test framework** is configured in this repo.

### Routing

Uses `react-router-dom` with `BrowserRouter`. Routes: `/` (home), `/video/:id` (detail), `/trending`, `/favorites`.

### Non-obvious notes

- Several `package.json` dependencies (`express`, `better-sqlite3`, `dotenv`, `@google/genai`, `motion`) are listed but **not imported** in any source file. They are intentionally kept as templates for future Cloudflare Workers / AI features. `npm install` may produce native compilation warnings for `better-sqlite3` — these are harmless.
- The `.env.example` references `GEMINI_API_KEY` and `APP_URL`, but neither is used in the current source. No `.env` file is required for local development.
- The entire UI is in Simplified Chinese.
