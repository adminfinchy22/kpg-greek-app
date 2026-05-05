# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

This is **kpg-greek-app**, a Greek language learning SPA (React 19 + TypeScript 6 + Vite 8) backed by a remote Supabase PostgreSQL database. The UI is in Russian, targeting learners preparing for the KPG A2 Greek exam.

### Required Environment Variables

The app requires a `.env.local` file at the repo root with:

```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Without valid credentials, the app renders but shows a "Failed to fetch" error screen. Unit tests run without these, but E2E tests require a live Supabase backend with data.

### Commands Reference

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Unit tests | `npm run test:unit` |
| E2E tests | `PLAYWRIGHT_BROWSERS_PATH=0 npm run test:e2e` |
| Build | `npm run build` |
| Preview build | `npm run preview` |

### Non-obvious Notes

- **Playwright browser path**: E2E tests use `PLAYWRIGHT_BROWSERS_PATH=0` which installs Chromium inside `node_modules`. This matches the `test:e2e` script in `package.json`.
- **E2E web server**: Playwright config auto-starts a dev server on `127.0.0.1:4173` (not the default 5173). If you're already running a dev server on 4173, it reuses it (`reuseExistingServer: true`).
- **Lint has pre-existing warnings/errors**: The codebase has known lint issues (react-hooks/set-state-in-effect in `TrainingSession.tsx`, react-hooks/exhaustive-deps in `WordDetail.tsx`). These are pre-existing and not blockers.
- **No local Supabase**: There's no `supabase/config.toml`, so `supabase start` won't work out of the box. The project connects to a remote Supabase instance only.
- **Node.js version**: Requires Node.js 22+ (Vite 8, TypeScript 6.0).
