# Create Project — Factory + "Create from JSON"

**Date:** 2026-06-29
**File touched:** `src/LearningTracker.jsx` (single file)

## Overview

Add a canonical project-object factory and a new "Create from JSON" path to the
new-project modal. Today three places build a project object with inline
literals (`saveProject`, `seedProject`, `createFirstProject`). This duplicates
the project shape and makes it impossible to create a project from an external
object. We introduce one factory all three route through, then add a modal tab
that builds a project from a pasted JSON object.

## Current State

Project shape (as built today):

```js
{ id, name, subtitle, goals[], sessions[], curriculum[], settings, activeGoalId }
```

- `goals[]`: `{ id, title, hourBudget, status, createdAt, deadline, subTasks[] }`
  where `subTasks[]` is `{ id, label, done, est }`.
- `curriculum[]`: month `{ id, title, weeks[] }` where `weeks[]` is
  `{ id, topic, build, done }`.
- `sessions[]`: `{ id, date, hours, learnHours, buildHours, goalId, note, source }`.
- `settings`: `{ totalHourGoal, dailyTarget, weeksTotal, pomo:{focus,short,long}, noise, volume }`.

Builders:
- `saveProject` (manual modal) — inline literal, empty goals/curriculum/sessions.
- `seedProject` — demo data, **stable** ids (`p_fs`, `g1`..`g5`, `g0`) that
  `sessions[].goalId` references.
- `createFirstProject` — onboarding wizard.

Helpers are module-level locals in `LearningTracker.jsx`: `uid`, `DAY`,
`isoDate`. `blankSettings` is a class method. `utils.js` is not used by this file.

The new-project modal renders from a view-model object `v` (state mapped to
props around lines 548–552); modal JSX around lines 1249–1282. UI is Arabic / RTL.

## Requirements

1. Single canonical builder `makeProject(obj)` — normalizes any partial/whole
   object into a valid project shape; all three existing builders route through it
   with **identical** observable behavior.
2. New "Create from JSON" tab in the new-project modal: paste a JSON project
   object, get a real project.
3. Pasted objects must not collide with existing project/goal/week/session ids.
4. Invalid JSON or an object with no usable name shows an inline error; no crash.
5. No regression to manual create, demo seed, or onboarding.

## Design

### 1. `makeProject(obj = {})` — factory (module-level)

Returns a fully-normalized project. Rules:
- `id`: keep `obj.id` if a non-empty string, else `uid()`.
- `name`: `String(obj.name || '').trim()` (caller/validation enforces non-empty).
- `subtitle`: trimmed, fallback `'مسار تعلّم جديد'`.
- `goals`: map each input goal through a `normalizeGoal` step — keep id if
  present else `uid()`; coerce `title`, `hourBudget` (number ≥ 0),
  `status` (one of `active|upcoming|done`, default `active`),
  `createdAt` (number, default `Date.now()`), `deadline` (number, default
  `Date.now()+14*DAY`), `subTasks` normalized (`id`, `label`, `done` bool,
  `est` number).
- `curriculum`: map each month — `id`, `title`, `weeks[]` normalized
  (`id`, `topic`, `build`, `done` bool).
- `sessions`: normalized (`id`, `date` number, `hours`/`learnHours`/`buildHours`
  numbers, `goalId`, `note`, `source` default `'manual'`). Non-array → `[]`.
- `settings`: `normalizeSettings(obj.settings)`.
- `activeGoalId`: recomputed — first goal with `status === 'active'`, else first
  goal, else `null`. (Never trust an incoming value, since it may reference a
  goal id we changed.)

Defensive: non-array `goals`/`curriculum`/`sessions` coerce to `[]`; missing
nested objects skipped.

### 2. `normalizeSettings(s = {})` (module-level)

Merge incoming settings over defaults:
```js
{ totalHourGoal: max(1, +s.totalHourGoal || 100),
  dailyTarget:   max(0.5, +s.dailyTarget || 2),
  weeksTotal:    +s.weeksTotal || 0,
  pomo: { focus: +s?.pomo?.focus || 25, short: +s?.pomo?.short || 5, long: +s?.pomo?.long || 15 },
  noise: s.noise || 'brown',
  volume: (s.volume ?? 60) }
```
Class `blankSettings(hourGoal, dailyTarget)` delegates:
`normalizeSettings({ totalHourGoal: hourGoal, dailyTarget })` — single source of truth.

### 3. `remapProjectIds(p)` — import-only (module-level)

Regenerate every id so a pasted object can never collide with existing data,
while preserving the goal↔session link:
- New project `id`.
- Build `goalIdMap = { oldGoalId: uid() }`; apply to each goal `id`, each
  `session.goalId` (via map; unknown ids → kept as-is or nulled — kept as-is),
  and `activeGoalId`.
- New `id` for every subTask, curriculum month, week, and session.
- Returns a new project object (no mutation of input).

Used **only** by the JSON path. Seed/onboarding keep their literal ids untouched.

### 4. Route existing builders through the factory

- `saveProject` (manual): `makeProject({ name: npName, subtitle: npSubtitle,
  settings: { totalHourGoal: +npHourGoal, dailyTarget: +npDailyTarget } })`.
- `seedProject`: `makeProject({ id: 'p_fs', name: 'مسار Full-Stack',
  subtitle: '…', goals, sessions, curriculum, settings })` from `seedData()`.
  Stable ids preserved because `makeProject` keeps provided ids and the seed
  goals/sessions carry their ids.
- `createFirstProject`: `makeProject({ name, subtitle, goals, curriculum,
  settings })` with the wizard-derived arrays.

Each builder keeps its own `commit(...)` / state-transition logic unchanged —
only the project-object construction is replaced.

### 5. Modal: two tabs

State additions (in `buildState` base + reset in `openNewProject`):
- `npMode: 'manual' | 'object'` (default `'manual'`)
- `npObjectText: ''`
- `npObjectError: ''`

View-model bindings (near 548–552):
- `npMode`, `setNpMode(mode)` (two tab handlers, also clears `npObjectError`)
- `npObjectText`, `setNpObjectText`
- `npObjectError`

Modal JSX: a two-button tab row at top — **يدوي** (manual) and **من JSON**
(Create from JSON), styled with existing `css()` tokens (active tab uses
`--app-accent`). Manual tab = current form. JSON tab = a `<textarea>` with a
placeholder showing the minimal expected shape, plus a red error line bound to
`npObjectError`. Create/cancel buttons shared across tabs.

### 6. `saveProject` branches on `npMode`

```
manual: validate npName.trim() (current behavior) -> makeProject(...) -> commit
object:
  try parsed = JSON.parse(npObjectText)
  catch -> setState npObjectError = 'JSON غير صالح' ; return
  proj = remapProjectIds(makeProject(parsed))
  if !proj.name -> setState npObjectError = 'النموذج لا يحتوي على اسم مشروع' ; return
  commit (same shape as manual: push project, set active, reset timer/log, close modal)
```
Both paths call `stopNoise()` and the same `commit` transition (push to
`projects`, set `activeProjectId`, close modal, reset `logGoalId` + `timer`).

### Expected JSON shape (documented in placeholder)

Minimal:
```json
{ "name": "مساري", "goals": [], "curriculum": [] }
```
Full objects exported from app state (a stored project) import cleanly because
`makeProject` + `remapProjectIds` normalize and re-id everything.

## Error Handling

- Invalid JSON → inline Arabic error, modal stays open, no throw.
- Object missing name → inline error.
- Missing/garbage nested fields → coerced to safe defaults by `makeProject`
  (never throws on shape).

## Testing

No unit-test runner configured (vite only). Verification:
1. `npm run build` — must compile/parse clean.
2. Manual browser (`npm run dev`):
   - Manual tab create → project created as before.
   - Demo seed (`loadDemo`) + onboarding still produce identical projects.
   - JSON tab: paste a valid object → project created, ids unique, no collision
     when pasting the same object twice.
   - JSON tab: paste invalid JSON → red error, no crash.
   - JSON tab: paste `{}` / no name → name error.

## Out of Scope (YAGNI)

- Export / "copy current project as JSON" button.
- Schema versioning / migration of pasted objects.
- File upload (paste-only).
