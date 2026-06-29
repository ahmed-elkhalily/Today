# مسار التعلّم · Learning Tracker

An RTL Arabic goal-focused deep-work app for going from frontend to full-stack. Built with React + Vite. All data persists in the browser (`localStorage`).

This implements the imported design ("Learning Tracker.dc.html") as real React.

## Projects & onboarding

On first run (no projects yet) the app shows a **3-step onboarding wizard** — *التفاصيل* (name, subtitle, hour goal, daily target), *الأهداف* (goals with sub-tasks and hours), *المنهج* (curriculum stages with weekly topics) — then creates the project. Goals/curriculum are optional; "إنشاء الآن" creates immediately from just the details.

Once a project exists, the sidebar header is a **project switcher**: each project is an independent learning path with its own goals, sessions, curriculum, and settings. Click it to switch between projects, create a new one, or delete one. State persists under `lt_state_v7`; data saved by the previous single-project version (`lt_state_v6`) is migrated automatically into the first project on load.

## Screens

- **اليوم (Today)** — greeting, active goal ring with pace ("you need ~X h/day"), today's hours vs target, subtasks, and a 7-day activity bar.
- **الأهداف (Goals)** — goal cards with progress rings and status badges (on track / behind / at risk / done / upcoming); click a card to make it the active goal; add new goals.
- **تركيز (Focus)** — Pomodoro timer (25/5/15) with a big ring, ambient white/pink/brown noise generated via the Web Audio API and a volume slider; finishing a focus block auto-logs a session.
- **السجل (Log)** — manual session entry (date, hours stepper, learn/build split slider, goal, note) plus a deletable timeline.
- **المنهج (Curriculum)** — the 3-month plan as month cards with checkable weekly items.
- **الإحصائيات (Stats)** — totals, completion %, streak, 8-week bars, learn-vs-build donut, and an activity heatmap.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Themes

Three dark themes ship in `src/index.css`: **slate** (default), **onyx**, **forest**. Switch by changing the `look` prop in `src/App.jsx`:

```jsx
<LearningTracker look="slate" />  // or "onyx" / "forest"
```

## Project structure

```
src/
  App.jsx              # mounts LearningTracker with a theme
  LearningTracker.jsx  # the whole app: state, logic, and all screens
  css.js               # helper: CSS-string -> React style object
  index.css            # theme tokens, RTL base, fonts, sliders
```

Fonts (Cairo + Tajawal) load from Google Fonts via `index.html`.

> Note: older starter files under `src/components`, `src/data`, `src/hooks` and `src/utils.js` are no longer used and can be deleted.

## Next step (real backend practice)

All state lives in one component and persists through `localStorage`. The natural next step — and great backend practice — is to replace `localStorage` reads/writes (`persist()` / `componentDidMount`) with `fetch()` calls to an Express + Postgres API, then add JWT auth. That turns this into a full-stack portfolio project.
