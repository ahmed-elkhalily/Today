# Learning Tracker — Design Brief

A copy-and-paste brief for generating the best possible UI. Hand the whole file to a design/UI tool, or use the "Ready-to-paste prompt" at the top.

---

## Ready-to-paste prompt

> Design a clean, modern, focused web app called **Learning Tracker** — a goal-focused deep-work companion for a self-taught developer studying ~3 hours a day to go from frontend to full-stack in 3 months. It is NOT a generic to-do app; it is built to drive the user toward outcomes and protect their focus time.
>
> The product has four connected pillars: (1) **Goals** — outcome-based goals with deadlines, sub-tasks, and an hour budget; (2) **Time management** — log study sessions against goals and show a live pace/forecast ("you need 1h/day to stay on track"); (3) **Focus mode** — a Pomodoro timer (25/5/15) with a circular progress ring; (4) **Ambient sound** — in-browser white/pink/brown noise that auto-plays during focus sessions.
>
> Tone: calm, motivating, distraction-free, slightly premium — think a blend of a study app and a deep-work tool. Flat design, no heavy gradients or skeuomorphism. Generous whitespace, soft shadows, rounded corners (12–16px). One deep navy/blue brand color with a single supporting accent. Strong typographic hierarchy. Mobile-responsive. Built with React + Tailwind CSS. Light mode primary; design with a dark mode in mind for focus sessions. Prioritize the "Today / Focus" view as the emotional center of the app.

---

## Product overview

**Name:** Learning Tracker
**Type:** Single-page web app (React + Tailwind), data persisted locally in the browser (localStorage); no backend yet.
**User:** An experienced React developer (5 yrs) learning backend to become full-stack. Disciplined but time-constrained — about 3 hours/day for 3 months (~216 hours total).
**Job to be done:** Show up daily, focus deeply, and stay on pace to hit concrete learning goals — without fighting the tool or getting distracted.

**The core loop the UI must reinforce:**
Set a goal → give it an hour budget + deadline → start a focus session (Pomodoro + ambient sound) → time logs automatically against the goal → see live progress and pace → repeat tomorrow.

---

## Feature set

### Built today
- **Curriculum / plan view** — a 3-month plan as month cards, each with weekly tasks (checkbox), a per-month progress bar, and a "build this" deliverable per week.
- **Daily log** — record sessions: total hours plus a learn-vs-build split, a focus/win/blocker note, and a deletable history list.
- **Pomodoro focus timer** — 25 / 5 / 15 min modes, circular progress ring, start/pause/reset; finishing a focus block auto-logs it to the daily log.
- **Stats bar** — hours logged vs the 216h goal (with progress bar), curriculum completion (weeks done), and learn-vs-build ratio.

### Planned (design should anticipate these)
- **Goals system** — outcome-based goals (title, description, deadline, hour budget, status) each containing sub-tasks. Goals become the app's backbone; curriculum weeks seed the initial goals.
- **Time management / pace** — attribute each session to a goal; per-goal pace indicator ("18h budgeted, 8h done, 12 days left → ~0.8h/day to finish"); ahead/behind/at-risk states.
- **Ambient sound** — Web Audio–generated white / pink / brown noise (no audio files), with a volume control, that auto-starts when a focus block begins and stops when it ends.
- **Today view** — a single screen that tells the user exactly what to do now: active goal, today's target hours, and a big "Start focus session" button.

---

## Screens / views

1. **Today (home)** — hero of the app. Active goal, today's hours target vs logged, current pace status, and a prominent Start Focus button. Calm and uncluttered.
2. **Goals** — list/grid of goal cards: title, deadline, progress ring or bar, hours done/budgeted, pace badge (On track / Behind / At risk). Click into a goal for sub-tasks and its session history.
3. **Focus** — full-screen-ish timer view: large circular countdown ring, mode tabs (Focus/Short/Long), ambient-sound controls (noise type + volume), and "what are you focusing on" + goal selector. Should feel quiet and immersive; consider auto-dimming / dark surface while running.
4. **Log / History** — session entry form (date, hours, learn/build split, goal, note) and a reverse-chronological history list with quick delete.
5. **Curriculum** — the structured 3-month plan (kept as a reference/roadmap), month cards with weekly checkboxes and deliverables.
6. **Stats / Dashboard (optional)** — totals, charts (hours over time, learn vs build), streaks/heatmap if added.

Navigation: a top tab bar or a slim left sidebar. Persistent stats summary near the top.

---

## Data model (for layout/affordance reference)

- **Goal**: id, title, description, deadline (date), hourBudget, status (active/done/paused), subTasks[], createdAt.
- **SubTask**: id, label, done.
- **Session**: id, date, hours, learnHours, buildHours, goalId, note, source (manual | pomodoro).
- **CurriculumWeek**: id, week, topic, build, done.
- **Settings**: pomodoro durations, default ambient noise type + volume, daily hour target.

---

## Visual & interaction direction

- **Personality:** calm, focused, motivating, lightly premium. A tool you want to open every morning.
- **Style:** flat and clean. Soft shadows, rounded corners (12–16px), generous whitespace, clear sections on cards. No busy gradients, no clip-art, no heavy borders.
- **Color:** one primary brand color (deep navy/blue, e.g. #1F3A5F / #2E6DA4) plus one supporting accent (a warm or green tone for "on track" / success). Use color sparingly and meaningfully — progress, status, and the primary action. Neutral grays for everything else.
- **Status colors:** green = on track / done, amber = behind / needs attention, red/orange = at risk / overdue. Always pair color with a label or icon for accessibility.
- **Typography:** clean sans-serif (Inter / system UI). Strong hierarchy — large bold numbers for hours/progress, clear section headers, quiet secondary text.
- **Data viz:** circular progress rings for the timer and goals; thin horizontal bars for overall progress; simple, unfussy charts.
- **Motion:** subtle and purposeful — smooth ring countdown, gentle progress-bar fills, soft transitions on tab switches. Nothing flashy.
- **Focus/dark consideration:** the Focus view should feel distraction-free; consider a darker, dimmed surface while a session runs.
- **States to design:** empty (no goals/sessions yet — friendly, encouraging), active (timer running), completed (block done → quick confirm), behind/at-risk (clear but non-punishing).
- **Responsive:** must work well on laptop and phone. On mobile, tabs collapse sensibly and the Focus timer stays the centerpiece.
- **Accessibility:** sufficient contrast, keyboard-operable controls, labels on all inputs, never rely on color alone for status.

---

## Technical constraints

- React 18 + Vite, Tailwind CSS for styling.
- State persisted in `localStorage` (no backend). Designed so persistence can later be swapped for a REST API.
- Ambient sound generated via the Web Audio API (no audio file assets).
- Keep components composable; the timer, goals, and log are independent but share session data.
