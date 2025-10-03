MedTriage frontend (Vite + React + Tailwind)

Setup (from project root):

cd frontend
npm install
npm run dev

This starts a dev server (Vite) on port 5173 by default. The frontend posts to http://127.0.0.1:8000/triage.

Notes:
- Tailwind is configured via `tailwind.config.cjs` and `postcss.config.cjs`.
- If you use a different backend host/port, update the fetch URL in `src/App.jsx`.
