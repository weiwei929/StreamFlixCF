# AGENTS.md

## Cursor Cloud specific instructions

**StreamFlix** is a React + Vite single-page video streaming prototype. No backend services are needed — the app uses mock data from `src/data.ts` with publicly hosted sample videos.

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

### Non-obvious notes

- Several `package.json` dependencies (`express`, `better-sqlite3`, `dotenv`, `@google/genai`, `motion`) are listed but **not imported** in any source file. They are provisioned for future Cloudflare Workers / AI features. `npm install` may produce native compilation warnings for `better-sqlite3` — these are harmless.
- The `.env.example` references `GEMINI_API_KEY` and `APP_URL`, but neither is used in the current source. No `.env` file is required for local development.
- The entire UI is in Simplified Chinese.
