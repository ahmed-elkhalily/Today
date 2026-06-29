> **⚠️ SUPERSEDED.** This plan described an earlier approach (a `makeProject`
> factory + a "From object" tab in the new-project modal). The feature actually
> shipped in the **onboarding** flow as a faithful port of the reference
> `Learning Tracker (standalone) (3).html`. See
> `docs/superpowers/specs/2026-06-29-create-from-json-design.md` for the
> as-shipped design. Kept for history only — do not execute.

# Create From JSON — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a canonical project-object factory and a "Create from JSON" tab to the new-project modal, so a project can be built from a pasted JSON object.

**Architecture:** Extract project construction into a pure, React-free ESM module (`src/project.mjs`) with three exported functions — `normalizeSettings`, `makeProject`, `remapProjectIds`. The existing class builders (`saveProject`, `seedProject`, `createFirstProject`, `blankSettings`) route through it. The new-project modal gains a two-tab UI (Manual / من JSON); the JSON tab parses pasted text, builds via `makeProject`, and re-ids via `remapProjectIds` to avoid collisions.

**Tech Stack:** React 18 (class component), Vite 5, plain ESM. Unit tests via the built-in `node:test` runner (no new dependency). UI is Arabic / RTL; inline styles via the `css()` string→object helper.

## Global Constraints

- Single feature file for UI logic: `src/LearningTracker.jsx`. New pure logic: `src/project.mjs`.
- No new npm dependencies.
- Existing behavior of manual create, demo seed (`loadDemo`/`seedProject`), and onboarding (`createFirstProject`) must stay observably identical.
- Project shape (exact key order): `{ id, name, subtitle, goals, sessions, curriculum, settings, activeGoalId }`.
- `settings` shape: `{ totalHourGoal, dailyTarget, weeksTotal, pomo:{focus,short,long}, noise, volume }`.
- Default subtitle string: `'مسار تعلّم جديد'` (verbatim).
- `uid()` format must match the app's: `Date.now().toString(36) + Math.random().toString(36).slice(2,7)`.
- Out of scope: export/copy-as-JSON button; localStorage migration paths (`LearningTracker.jsx` lines ~114–130); schema versioning; file upload.

---

## File Structure

- **Create `src/project.mjs`** — pure project factory + normalizers. No React import. Self-contained `uid`/`DAY`. Sole responsibility: turn any partial/whole object into a valid, fully-normalized project, and re-id a project for safe import.
- **Create `src/project.test.mjs`** — `node:test` unit tests for the three exported functions.
- **Modify `src/LearningTracker.jsx`** — import the factory; replace inline project construction in `blankSettings`, `seedProject`, `saveProject`, `createFirstProject`; add modal tab state, view-model bindings, and the two-tab modal JSX.

---

### Task 1: `src/project.mjs` scaffold + `normalizeSettings`

**Files:**
- Create: `src/project.mjs`
- Test: `src/project.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `export const DAY`, `export const uid`, `export function normalizeSettings(s = {})` → settings object `{ totalHourGoal, dailyTarget, weeksTotal, pomo:{focus,short,long}, noise, volume }`.

- [ ] **Step 1: Write the failing test**

Create `src/project.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSettings } from './project.mjs'

test('normalizeSettings fills defaults', () => {
  const s = normalizeSettings()
  assert.equal(s.totalHourGoal, 100)
  assert.equal(s.dailyTarget, 2)
  assert.equal(s.weeksTotal, 0)
  assert.deepEqual(s.pomo, { focus: 25, short: 5, long: 15 })
  assert.equal(s.noise, 'brown')
  assert.equal(s.volume, 60)
})

test('normalizeSettings honors provided values', () => {
  const s = normalizeSettings({ totalHourGoal: 216, dailyTarget: 3, weeksTotal: 12, pomo: { focus: 50, short: 10, long: 20 }, noise: 'rain', volume: 30 })
  assert.equal(s.totalHourGoal, 216)
  assert.equal(s.dailyTarget, 3)
  assert.equal(s.weeksTotal, 12)
  assert.deepEqual(s.pomo, { focus: 50, short: 10, long: 20 })
  assert.equal(s.noise, 'rain')
  assert.equal(s.volume, 30)
})

test('normalizeSettings defaults falsy hour/day to base then clamps', () => {
  const s = normalizeSettings({ totalHourGoal: 0, dailyTarget: 0 })
  assert.equal(s.totalHourGoal, 100)
  assert.equal(s.dailyTarget, 2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/project.test.mjs`
Expected: FAIL — `Cannot find module '.../src/project.mjs'` (module not created yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/project.mjs`:

```js
// Pure project factory + normalizers. No React — importable by node:test and Vite.
export const DAY = 86400000

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export function normalizeSettings(s = {}) {
  const o = s && typeof s === 'object' ? s : {}
  const p = o.pomo && typeof o.pomo === 'object' ? o.pomo : {}
  return {
    totalHourGoal: Math.max(1, (+o.totalHourGoal) || 100),
    dailyTarget: Math.max(0.5, (+o.dailyTarget) || 2),
    weeksTotal: (+o.weeksTotal) || 0,
    pomo: {
      focus: (+p.focus) || 25,
      short: (+p.short) || 5,
      long: (+p.long) || 15,
    },
    noise: o.noise || 'brown',
    volume: o.volume == null ? 60 : ((+o.volume) || 0),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/project.test.mjs`
Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/project.mjs src/project.test.mjs
git commit -m "feat: add project.mjs with normalizeSettings"
```

---

### Task 2: `makeProject` + nested normalizers

**Files:**
- Modify: `src/project.mjs`
- Test: `src/project.test.mjs`

**Interfaces:**
- Consumes: `normalizeSettings`, `uid`, `DAY` (Task 1).
- Produces: `export function makeProject(obj = {})` → full project `{ id, name, subtitle, goals, sessions, curriculum, settings, activeGoalId }`. Goals: `{ id, title, hourBudget, status, createdAt, deadline, subTasks:[{id,label,done,est}] }`. Curriculum months: `{ id, title, weeks:[{id,topic,build,done}] }`. Sessions: `{ id, date, hours, learnHours, buildHours, goalId, note, source }`. `activeGoalId` = first `status==='active'` goal id, else first goal id, else `null`. Provided ids are preserved; missing ids filled with `uid()`.

- [ ] **Step 1: Write the failing test**

Append to `src/project.test.mjs`:

```js
import { makeProject } from './project.mjs'

test('makeProject returns full shape with defaults', () => {
  const p = makeProject({ name: '  X ' })
  assert.equal(p.name, 'X')
  assert.equal(p.subtitle, 'مسار تعلّم جديد')
  assert.deepEqual(p.goals, [])
  assert.deepEqual(p.sessions, [])
  assert.deepEqual(p.curriculum, [])
  assert.equal(p.activeGoalId, null)
  assert.ok(p.id)
  assert.equal(p.settings.totalHourGoal, 100)
})

test('makeProject keeps provided id', () => {
  assert.equal(makeProject({ id: 'p_fs', name: 'a' }).id, 'p_fs')
})

test('makeProject normalizes goals and picks first active as activeGoalId', () => {
  const p = makeProject({ name: 'a', goals: [
    { id: 'g1', title: 'up', status: 'upcoming' },
    { id: 'g2', title: 'act', status: 'active', subTasks: [{ label: 't', done: true }] },
  ]})
  assert.equal(p.activeGoalId, 'g2')
  assert.equal(p.goals[0].id, 'g1')
  assert.equal(p.goals[0].status, 'upcoming')
  assert.equal(p.goals[1].subTasks[0].done, true)
  assert.ok(p.goals[1].subTasks[0].id) // filled
})

test('makeProject defaults activeGoalId to first goal when none active', () => {
  const p = makeProject({ name: 'a', goals: [{ id: 'g1', title: 'd', status: 'done' }] })
  assert.equal(p.activeGoalId, 'g1')
})

test('makeProject coerces non-array fields to []', () => {
  const p = makeProject({ name: 'a', goals: 'nope', curriculum: null, sessions: 5 })
  assert.deepEqual(p.goals, [])
  assert.deepEqual(p.curriculum, [])
  assert.deepEqual(p.sessions, [])
})

test('makeProject normalizes curriculum weeks', () => {
  const p = makeProject({ name: 'a', curriculum: [{ title: 'm', weeks: [{ topic: 't', build: 'b' }] }] })
  assert.equal(p.curriculum[0].title, 'm')
  assert.equal(p.curriculum[0].weeks[0].topic, 't')
  assert.equal(p.curriculum[0].weeks[0].done, false)
  assert.ok(p.curriculum[0].weeks[0].id)
})

test('makeProject normalizes an invalid status to active', () => {
  const p = makeProject({ name: 'a', goals: [{ id: 'g1', title: 'x', status: 'bogus' }] })
  assert.equal(p.goals[0].status, 'active')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/project.test.mjs`
Expected: FAIL — `makeProject is not a function` / `SyntaxError` for missing export.

- [ ] **Step 3: Write minimal implementation**

Add to `src/project.mjs` (below `normalizeSettings`):

```js
const VALID_STATUS = new Set(['active', 'upcoming', 'done'])
const str = (v) => (v == null ? '' : String(v))

function normalizeSubTask(t = {}) {
  const o = t && typeof t === 'object' ? t : {}
  return {
    id: o.id ? String(o.id) : uid(),
    label: str(o.label),
    done: !!o.done,
    est: (+o.est) || 0,
  }
}

function normalizeGoal(g = {}) {
  const o = g && typeof g === 'object' ? g : {}
  return {
    id: o.id ? String(o.id) : uid(),
    title: str(o.title),
    hourBudget: Math.max(0, (+o.hourBudget) || 0),
    status: VALID_STATUS.has(o.status) ? o.status : 'active',
    createdAt: (+o.createdAt) || Date.now(),
    deadline: (+o.deadline) || (Date.now() + 14 * DAY),
    subTasks: Array.isArray(o.subTasks) ? o.subTasks.map(normalizeSubTask) : [],
  }
}

function normalizeWeek(w = {}) {
  const o = w && typeof w === 'object' ? w : {}
  return {
    id: o.id ? String(o.id) : uid(),
    topic: str(o.topic),
    build: str(o.build),
    done: !!o.done,
  }
}

function normalizeMonth(m = {}) {
  const o = m && typeof m === 'object' ? m : {}
  return {
    id: o.id ? String(o.id) : uid(),
    title: str(o.title),
    weeks: Array.isArray(o.weeks) ? o.weeks.map(normalizeWeek) : [],
  }
}

function normalizeSession(x = {}) {
  const o = x && typeof x === 'object' ? x : {}
  return {
    id: o.id ? String(o.id) : uid(),
    date: (+o.date) || Date.now(),
    hours: (+o.hours) || 0,
    learnHours: (+o.learnHours) || 0,
    buildHours: (+o.buildHours) || 0,
    goalId: o.goalId == null ? null : o.goalId,
    note: str(o.note),
    source: o.source || 'manual',
  }
}

export function makeProject(obj = {}) {
  const o = obj && typeof obj === 'object' ? obj : {}
  const goals = Array.isArray(o.goals) ? o.goals.map(normalizeGoal) : []
  const sessions = Array.isArray(o.sessions) ? o.sessions.map(normalizeSession) : []
  const curriculum = Array.isArray(o.curriculum) ? o.curriculum.map(normalizeMonth) : []
  const active = goals.find(g => g.status === 'active') || goals[0] || null
  return {
    id: o.id ? String(o.id) : uid(),
    name: str(o.name).trim(),
    subtitle: str(o.subtitle).trim() || 'مسار تعلّم جديد',
    goals,
    sessions,
    curriculum,
    settings: normalizeSettings(o.settings),
    activeGoalId: active ? active.id : null,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/project.test.mjs`
Expected: PASS — all tests (Task 1 + Task 2) passing.

- [ ] **Step 5: Commit**

```bash
git add src/project.mjs src/project.test.mjs
git commit -m "feat: add makeProject factory with nested normalizers"
```

---

### Task 3: `remapProjectIds` (import-only id regeneration)

**Files:**
- Modify: `src/project.mjs`
- Test: `src/project.test.mjs`

**Interfaces:**
- Consumes: `makeProject`, `uid` (Tasks 1–2).
- Produces: `export function remapProjectIds(p)` → a new project object (input not mutated) with fresh `id`, fresh goal ids (with `session.goalId` and `activeGoalId` remapped to match), fresh subTask/week/session ids.

- [ ] **Step 1: Write the failing test**

Append to `src/project.test.mjs`:

```js
import { remapProjectIds } from './project.mjs'

test('remapProjectIds regenerates ids and preserves goal-session link', () => {
  const base = makeProject({ id: 'p1', name: 'a', goals: [{ id: 'g1', title: 'g', status: 'active' }], sessions: [{ id: 's1', goalId: 'g1', hours: 1 }] })
  const r = remapProjectIds(base)
  assert.notEqual(r.id, 'p1')
  assert.notEqual(r.goals[0].id, 'g1')
  assert.equal(r.sessions[0].goalId, r.goals[0].id) // link preserved
  assert.notEqual(r.sessions[0].id, 's1')
  assert.equal(r.activeGoalId, r.goals[0].id)
})

test('remapProjectIds does not mutate input', () => {
  const base = makeProject({ id: 'p1', name: 'a', goals: [{ id: 'g1', title: 'g' }] })
  remapProjectIds(base)
  assert.equal(base.id, 'p1')
  assert.equal(base.goals[0].id, 'g1')
})

test('remapProjectIds two calls produce different project ids', () => {
  const base = makeProject({ name: 'a', goals: [{ title: 'g', status: 'active' }] })
  const a = remapProjectIds(base)
  const b = remapProjectIds(base)
  assert.notEqual(a.id, b.id)
  assert.notEqual(a.goals[0].id, b.goals[0].id)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/project.test.mjs`
Expected: FAIL — `remapProjectIds is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/project.mjs` (bottom):

```js
export function remapProjectIds(p) {
  const goalIdMap = {}
  const goals = (p.goals || []).map(g => {
    const newId = uid()
    goalIdMap[g.id] = newId
    return {
      ...g,
      id: newId,
      subTasks: (g.subTasks || []).map(t => ({ ...t, id: uid() })),
    }
  })
  const sessions = (p.sessions || []).map(s => ({
    ...s,
    id: uid(),
    goalId: s.goalId != null && goalIdMap[s.goalId] ? goalIdMap[s.goalId] : s.goalId,
  }))
  const curriculum = (p.curriculum || []).map(m => ({
    ...m,
    id: uid(),
    weeks: (m.weeks || []).map(w => ({ ...w, id: uid() })),
  }))
  return {
    ...p,
    id: uid(),
    goals,
    sessions,
    curriculum,
    activeGoalId: p.activeGoalId != null && goalIdMap[p.activeGoalId] ? goalIdMap[p.activeGoalId] : null,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/project.test.mjs`
Expected: PASS — all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/project.mjs src/project.test.mjs
git commit -m "feat: add remapProjectIds for safe project import"
```

---

### Task 4: Route existing builders through `makeProject`

**Files:**
- Modify: `src/LearningTracker.jsx` (import line; `blankSettings` ~41; `seedProject` ~43–47; `saveProject` ~171–177; `createFirstProject` ~242–254)

**Interfaces:**
- Consumes: `makeProject`, `normalizeSettings` (Tasks 1–2).
- Produces: no signature changes; identical observable project objects.

This task has no unit test (it touches a React class component with no test harness). It is verified by the `node:test` suite still passing, a clean `npm run build`, and manual browser checks.

- [ ] **Step 1: Add the import**

At the top of `src/LearningTracker.jsx`, immediately after `import { css } from './css'`:

```js
import { makeProject, normalizeSettings, remapProjectIds } from './project.mjs'
```

(`remapProjectIds` is used in Task 5; importing it now keeps the import line stable.)

- [ ] **Step 2: Delegate `blankSettings` to `normalizeSettings`**

Replace the `blankSettings` method (currently around line 41):

```js
  blankSettings(hourGoal, dailyTarget) { return { totalHourGoal: Math.max(1, hourGoal||100), dailyTarget: Math.max(0.5, dailyTarget||2), weeksTotal: 0, pomo: { focus:25, short:5, long:15 }, noise:'brown', volume:60 } }
```

with:

```js
  blankSettings(hourGoal, dailyTarget) { return normalizeSettings({ totalHourGoal: hourGoal, dailyTarget }) }
```

- [ ] **Step 3: Route `seedProject` through `makeProject`**

Replace the `seedProject` method (currently around lines 43–47):

```js
  seedProject() {
    const d = this.seedData()
    const first = d.goals.find(g => g.status === 'active') || d.goals[0] || null
    return { id: 'p_fs', name: 'مسار Full-Stack', subtitle: 'من واجهات إلى Full-Stack', goals: d.goals, sessions: d.sessions, curriculum: d.curriculum, settings: d.settings, activeGoalId: first ? first.id : null }
  }
```

with:

```js
  seedProject() {
    const d = this.seedData()
    return makeProject({ id: 'p_fs', name: 'مسار Full-Stack', subtitle: 'من واجهات إلى Full-Stack', goals: d.goals, sessions: d.sessions, curriculum: d.curriculum, settings: d.settings })
  }
```

(`makeProject` recomputes `activeGoalId` to the same value — first active goal `g1`. Note: the `label` key on seed curriculum months is dropped; it is not read anywhere in the app.)

- [ ] **Step 4: Route the manual `saveProject` through `makeProject`**

Replace the `saveProject` method (currently around lines 171–177):

```js
  saveProject() {
    const s = this.state
    if (!s.npName.trim()) return
    this.stopNoise()
    const pr = { id: uid(), name: s.npName.trim(), subtitle: s.npSubtitle.trim() || 'مسار تعلّم جديد', goals: [], sessions: [], curriculum: [], settings: this.blankSettings(+s.npHourGoal||100, +s.npDailyTarget||2), activeGoalId: null }
    this.commit(st => ({ projects: [...st.projects, pr], activeProjectId: pr.id, showProjectModal: false, logGoalId: '', timer: { ...st.timer, mode:'focus', running:false, secsLeft: pr.settings.pomo.focus*60, goalId: null } }))
  }
```

with:

```js
  saveProject() {
    const s = this.state
    if (!s.npName.trim()) return
    this.stopNoise()
    const pr = makeProject({ name: s.npName, subtitle: s.npSubtitle, settings: { totalHourGoal: +s.npHourGoal, dailyTarget: +s.npDailyTarget } })
    this.commit(st => ({ projects: [...st.projects, pr], activeProjectId: pr.id, showProjectModal: false, logGoalId: '', timer: { ...st.timer, mode:'focus', running:false, secsLeft: pr.settings.pomo.focus*60, goalId: null } }))
  }
```

(Task 5 replaces this method again to add the JSON branch; this intermediate form keeps Task 4 independently testable.)

- [ ] **Step 5: Route `createFirstProject` through `makeProject`**

In `createFirstProject` (around line 253), replace the inline `proj` construction:

```js
    const proj = { id:uid(), name:ob.name.trim(), subtitle:ob.subtitle.trim()||'مسار تعلّم جديد', goals, sessions:[], curriculum, settings:this.blankSettings(+ob.hourGoal||100, +ob.dailyTarget||2), activeGoalId: goals[0]?goals[0].id:null }
```

with:

```js
    const proj = makeProject({ name:ob.name, subtitle:ob.subtitle, goals, curriculum, settings:{ totalHourGoal:+ob.hourGoal, dailyTarget:+ob.dailyTarget } })
```

(The local `goals` variable is still used by the following `this.commit(...)` line for `logGoalId`/timer `goalId`; ids are preserved by `makeProject`, so `goals[0].id === proj.goals[0].id`.)

- [ ] **Step 6: Verify the unit suite still passes**

Run: `node --test src/project.test.mjs`
Expected: PASS — unchanged from Task 3.

- [ ] **Step 7: Verify the build compiles**

Run: `npm run build`
Expected: Vite build completes with no errors; `dist/` produced.

- [ ] **Step 8: Manual smoke check**

Run: `npm run dev`, open the app.
- Click "Load demo" (تجربة) path or trigger `loadDemo` → demo project loads with goals, sessions, curriculum exactly as before; active goal highlighted.
- Open the new-project modal → fill name → "إنشاء المشروع" → new empty project created and becomes active.
Expected: both behave exactly as before this task.

- [ ] **Step 9: Commit**

```bash
git add src/LearningTracker.jsx
git commit -m "refactor: route project builders through makeProject factory"
```

---

### Task 5: "Create from JSON" modal tab

**Files:**
- Modify: `src/LearningTracker.jsx` (`buildState` base ~30; `openNewProject` ~170; view-model block ~548–552; modal JSX ~1257–1278; `saveProject` method)

**Interfaces:**
- Consumes: `makeProject`, `remapProjectIds` (Tasks 2–3); view-model object `v`; `css()` helper.
- Produces: new state keys `npMode`, `npObjectText`, `npObjectError`; new `v` bindings `npMode`, `setNpModeManual`, `setNpModeObject`, `npObjectText`, `setNpObjectText`, `npObjectError`.

No unit test (React UI). Verified by `npm run build` + manual browser checks.

- [ ] **Step 1: Add modal state to `buildState`**

In `buildState`, the `base` object (around line 30) currently has:

```js
      showProjectMenu: false, showProjectModal: false, npName: '', npSubtitle: '', npHourGoal: 100, npDailyTarget: 2,
```

Replace with:

```js
      showProjectMenu: false, showProjectModal: false, npName: '', npSubtitle: '', npHourGoal: 100, npDailyTarget: 2,
      npMode: 'manual', npObjectText: '', npObjectError: '',
```

- [ ] **Step 2: Reset modal state in `openNewProject`**

Replace `openNewProject` (around line 170):

```js
  openNewProject() { this.setState({ showProjectModal: true, showProjectMenu: false, npName: '', npSubtitle: '', npHourGoal: 100, npDailyTarget: 2 }) }
```

with:

```js
  openNewProject() { this.setState({ showProjectModal: true, showProjectMenu: false, npName: '', npSubtitle: '', npHourGoal: 100, npDailyTarget: 2, npMode: 'manual', npObjectText: '', npObjectError: '' }) }
```

- [ ] **Step 3: Replace `saveProject` with the branching version**

Replace the `saveProject` method (the Task-4 form) with:

```js
  saveProject() {
    const s = this.state
    let pr
    if (s.npMode === 'object') {
      let parsed
      try { parsed = JSON.parse(s.npObjectText) }
      catch (e) { this.setState({ npObjectError: 'JSON غير صالح — تحقّق من التنسيق.' }); return }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) { this.setState({ npObjectError: 'يجب أن يكون النموذج كائن مشروع.' }); return }
      pr = remapProjectIds(makeProject(parsed))
      if (!pr.name) { this.setState({ npObjectError: 'النموذج لا يحتوي على اسم مشروع (name).' }); return }
    } else {
      if (!s.npName.trim()) return
      pr = makeProject({ name: s.npName, subtitle: s.npSubtitle, settings: { totalHourGoal: +s.npHourGoal, dailyTarget: +s.npDailyTarget } })
    }
    this.stopNoise()
    this.commit(st => ({ projects: [...st.projects, pr], activeProjectId: pr.id, showProjectModal: false, logGoalId: '', timer: { ...st.timer, mode:'focus', running:false, secsLeft: pr.settings.pomo.focus*60, goalId: null } }))
  }
```

- [ ] **Step 4: Add view-model bindings**

In the view-model block, after the `npDailyTarget` binding (around line 552):

```js
      npDailyTarget: st.npDailyTarget, setNpDailyTarget: e => this.setState({npDailyTarget:e.target.value}),
```

add:

```js
      npMode: st.npMode,
      setNpModeManual: () => this.setState({ npMode: 'manual', npObjectError: '' }),
      setNpModeObject: () => this.setState({ npMode: 'object', npObjectError: '' }),
      npObjectText: st.npObjectText, setNpObjectText: e => this.setState({ npObjectText: e.target.value, npObjectError: '' }),
      npObjectError: st.npObjectError,
```

- [ ] **Step 5: Add the tab row and JSON panel; gate the manual fields**

In the modal JSX, the description line (around line 1257) is:

```jsx
            <div style={css('font-size:13px;color:var(--app-muted);margin-bottom:22px;')}>مسار تعلّم جديد بأهدافه ومنهجه وجلساته الخاصة — كل شيء تضيفه بنفسك.</div>
```

Immediately **after** that div, insert the tab row:

```jsx
            <div style={css('display:flex;gap:8px;margin-bottom:18px;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:12px;padding:4px;')}>
              <button onClick={v.setNpModeManual} style={css('flex:1;padding:9px;border:none;border-radius:9px;cursor:pointer;font:600 13px var(--font-brand);' + (v.npMode==='manual' ? 'background:var(--app-accent);color:var(--app-accent-on);' : 'background:transparent;color:var(--app-muted);'))}>يدوي</button>
              <button onClick={v.setNpModeObject} style={css('flex:1;padding:9px;border:none;border-radius:9px;cursor:pointer;font:600 13px var(--font-brand);' + (v.npMode==='object' ? 'background:var(--app-accent);color:var(--app-accent-on);' : 'background:transparent;color:var(--app-muted);'))}>من JSON</button>
            </div>
```

Then wrap the existing manual fields (the name label/input, subtitle label/input, and the hour/day flex row — currently lines ~1259–1274) in a manual-mode guard, and add the JSON panel. The block from the name `<label>` through the closing `</div>` of the hour/day row becomes:

```jsx
            {v.npMode === 'manual' && (<>
            <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>اسم المشروع</label>
            <input value={v.npName} onChange={v.setNpName} placeholder="مثال: مسار الذكاء الاصطناعي" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:16px;font-size:14px;color:var(--app-text);outline:none;')} />

            <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>وصف مختصر</label>
            <input value={v.npSubtitle} onChange={v.setNpSubtitle} placeholder="مثال: من Python إلى نماذج الإنتاج" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:16px;font-size:14px;color:var(--app-text);outline:none;')} />

            <div style={css('display:flex;gap:14px;margin-bottom:22px;')}>
              <div style={css('flex:1;')}>
                <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>هدف الساعات</label>
                <input type="number" min="1" value={v.npHourGoal} onChange={v.setNpHourGoal} className="num" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);outline:none;')} />
              </div>
              <div style={css('flex:1;')}>
                <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>ساعات اليوم</label>
                <input type="number" min="0.5" step="0.5" value={v.npDailyTarget} onChange={v.setNpDailyTarget} className="num" style={css('width:100%;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;font-size:14px;color:var(--app-text);outline:none;')} />
              </div>
            </div>
            </>)}

            {v.npMode === 'object' && (<>
            <label style={css('display:block;font-size:13px;color:var(--app-muted);margin-bottom:7px;')}>كائن المشروع (JSON)</label>
            <textarea value={v.npObjectText} onChange={v.setNpObjectText} placeholder={'{\n  "name": "مساري",\n  "goals": [],\n  "curriculum": []\n}'} style={css('width:100%;min-height:180px;background:var(--app-surface-2);border:1px solid var(--app-border);border-radius:11px;padding:12px 14px;margin-bottom:10px;font-size:13px;line-height:1.6;color:var(--app-text);outline:none;font-family:monospace;direction:ltr;text-align:left;resize:vertical;')} />
            {v.npObjectError && (<div style={css('color:#ef4444;font-size:12px;margin-bottom:14px;')}>{v.npObjectError}</div>)}
            <div style={css('font-size:11px;color:var(--app-muted);margin-bottom:22px;')}>الصق كائن مشروع كامل أو جزئي. الحقول الناقصة تُملأ تلقائيًا، والمعرّفات تُولّد من جديد.</div>
            </>)}
```

Leave the existing cancel/create button row (lines ~1276–1279) unchanged — `v.saveProject` now handles both modes.

- [ ] **Step 6: Verify the build compiles**

Run: `npm run build`
Expected: Vite build completes, no JSX/syntax errors.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, open the new-project modal.
- **Manual tab (يدوي):** default tab; create as before still works.
- **JSON tab (من JSON):** paste a valid object, e.g.
  ```json
  { "name": "مسار تجريبي", "goals": [ { "title": "هدف", "status": "active", "subTasks": [ { "label": "مهمة" } ] } ], "curriculum": [ { "title": "مرحلة", "weeks": [ { "topic": "أسبوع", "build": "مشروع" } ] } ] }
  ```
  → "إنشاء المشروع" → project created, becomes active, goal/curriculum visible.
- **Collision check:** paste the same object again → a second distinct project is created (no id clash, both usable).
- **Invalid JSON:** type `{ not json` → red error "JSON غير صالح…", modal stays open.
- **No name:** paste `{}` → red error about missing name.
- Switching tabs clears any visible error.

- [ ] **Step 8: Commit**

```bash
git add src/LearningTracker.jsx
git commit -m "feat: add Create from JSON tab to new-project modal"
```

---

## Self-Review

**Spec coverage:**
- Factory `makeProject` → Task 2. ✓
- `normalizeSettings` single source of truth (`blankSettings` delegates) → Tasks 1, 4. ✓
- `remapProjectIds` collision-safe import → Task 3, used in Task 5. ✓
- Route `saveProject`/`seedProject`/`createFirstProject` through factory → Task 4. ✓
- "Create from JSON" tab + state + bindings + parse/validate/branch → Task 5. ✓
- Error handling (invalid JSON, non-object, missing name) → Task 5 Step 3. ✓
- Verification: `node --test` + `npm run build` + manual → Tasks 4, 5. ✓
- Out of scope (export button, migration paths, versioning) → respected. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; tests show concrete assertions. ✓

**Type/name consistency:** `makeProject`, `normalizeSettings`, `remapProjectIds` named identically across project.mjs, tests, and LearningTracker import. View-model keys (`npMode`, `setNpModeManual`, `setNpModeObject`, `npObjectText`, `setNpObjectText`, `npObjectError`) match between Step 4 bindings and Step 5 JSX. Project shape/key order consistent with Global Constraints. ✓
