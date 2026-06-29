# Create From JSON — Design (as shipped)

**Date:** 2026-06-29
**File touched:** `src/LearningTracker.jsx` (single file)

## Overview

Add a "Create from JSON" path to the **first-project onboarding** flow. The
onboarding screen (shown when `projects` is empty) gains a two-tab toggle:
**نموذج تفاعلي** (interactive form — the existing 3-step wizard) and
**لصق JSON** (paste a project object). The JSON tab accepts a pasted project
object, validates it live, and creates the project in one shot.

This is a faithful port of the reference implementation in
`Learning Tracker (standalone) (3).html` (the design tool export of the same
app), adapted from its `sc-`/DCLogic template to the React/JSX source.

> **Note — superseded approach.** An earlier draft of this spec proposed a
> canonical `makeProject(obj)` factory + a "From object" tab in the
> new-project *modal* (`showProjectModal`). The reference instead places the
> feature in the **onboarding** flow and reuses the onboarding `ob` shape, so
> that is what shipped. The factory module was not built.

## Where it lives

- **Onboarding only** (`v.noProjects`). The new-project modal
  (`showProjectModal`, for adding projects later) is unchanged.

## State (`blankOb()`)

Added to the onboarding object: `mode: 'form' | 'json'` (default `'form'`),
`json: ''`, `jsonError: ''`, `jsonOk: false`.

## Logic (class methods on `LearningTracker`)

- `buildProjectFromOb(ob)` — pure-ish factory extracted from the old inline
  `createFirstProject`. Builds a full project from the onboarding shape;
  JSON-safe (`(g.title||'').trim()`), honors `g.status === 'done'` and
  `t.done`/`w.done`. Task-hour sum overrides a goal's `budget` when present.
- `commitFirstProject(proj)` — commits the project, switches to `today`, resets
  timer + `ob`.
- `createFirstProject()` — `commitFirstProject(buildProjectFromOb(ob))` after a
  name check (both form and quick-create routes use this).
- `validateObJson(text)` → `{ ok, error, value }`. Checks: non-empty, parseable,
  root is an object (not array/null), `name` is a non-empty string; `hourGoal`/
  `dailyTarget`/`budget`/`hours` are numbers ≥ 0 when present; `goals`/`stages`/
  `tasks`/`weeks` are arrays when present; each goal has a `title`. On success,
  `value` is a normalized **`ob`-shaped** object (so it feeds straight into
  `buildProjectFromOb`); `error` carries a success summary
  (`جاهز للإنشاء · N أهداف · M مراحل`). All error strings are Arabic.
- `setObMode(mode)`, `setObJson(text)` (validates on every keystroke and stores
  `json`/`jsonError`/`jsonOk`), `loadJsonSample()` (inserts a worked example),
  `createFromJson()` (re-validates, then commits via the factory).

## View-model bindings

`obMode`, `obFormMode`, `obJsonMode`, `setFormMode`, `setJsonMode`,
`formTabStyle`, `jsonTabStyle`, `obJson`, `setObJson`, `obJsonError`,
`obJsonOk`, `obHasJson`, `jsonMsgStyle` (green when valid, red when not),
`loadJsonSample`, `createFromJson`.

## UI

- Tab toggle inserted after the onboarding intro line.
- Form-mode content (step pills + the 3 step panels + back/next/quick-create
  buttons) wrapped in `{v.obFormMode && (<>…</>)}`.
- JSON-mode panel `{v.obJsonMode && (…)}`: header + "إدراج مثال" button, a
  monospace `<textarea>` (`dir="ltr"`) with a shape placeholder, a live
  validity message line (only when there is text), a supported-keys hint, and
  the "إنشاء المسار" create button.

## Expected JSON shape

Minimal: `{ "name": "..." }`. Full keys: `name` (required), `subtitle`,
`hourGoal`, `dailyTarget`, `goals[]` (`title`, `budget`, `deadline`, `status`,
`tasks[]`→`label`,`hours`,`done`), `stages[]` (`title`, `weeks[]`→`topic`,
`build`, `done`).

## Verification

- `npm run build` — compiles clean.
- Node unit test of `validateObJson` + `buildProjectFromOb` (8 cases: valid
  sample, invalid JSON, missing/blank name, array root, goals-not-array,
  goal-missing-title, name-only minimal, done-status preserved) — all pass.
- Manual: onboarding shows the tab toggle; form mode unchanged; JSON mode →
  paste/sample → create; invalid input shows a red message and blocks creation.

## Out of scope (YAGNI)

- JSON import in the later new-project modal.
- Export / copy-as-JSON. File upload. Schema versioning.
