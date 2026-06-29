import { useState } from 'react'
import { round1, todayISO } from '../utils'

const empty = (date) => ({
  date,
  hours: '',
  learnHours: '',
  buildHours: '',
  focus: '',
})

export default function DailyLog({ sessions, addSession, setSessions }) {
  const [form, setForm] = useState(empty(todayISO()))

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const hours = Number(form.hours)
    if (!form.date || !hours) return
    addSession({
      date: form.date,
      hours: round1(hours),
      learnHours: round1(Number(form.learnHours) || 0),
      buildHours: round1(Number(form.buildHours) || 0),
      focus: form.focus.trim(),
    })
    setForm(empty(form.date))
  }

  const remove = (id) =>
    setSessions((prev) => prev.filter((s) => s.id !== id))

  const field =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <form
        onSubmit={submit}
        className="md:col-span-2 space-y-3 rounded-xl bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold text-ink">Log a session</h2>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Date</label>
          <input type="date" value={form.date} onChange={set('date')} className={field} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Total h</label>
            <input
              type="number" min="0" step="0.25" value={form.hours}
              onChange={set('hours')} className={field} placeholder="3"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Learn h</label>
            <input
              type="number" min="0" step="0.25" value={form.learnHours}
              onChange={set('learnHours')} className={field} placeholder="1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Build h</label>
            <input
              type="number" min="0" step="0.25" value={form.buildHours}
              onChange={set('buildHours')} className={field} placeholder="1.5"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Focus / win / blocker
          </label>
          <textarea
            rows="3" value={form.focus} onChange={set('focus')} className={field}
            placeholder="What did you work on? Any win or blocker?"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white transition hover:bg-ink"
        >
          Add session
        </button>
      </form>

      <div className="md:col-span-3 space-y-2">
        <h2 className="text-lg font-bold text-ink">History</h2>
        {sessions.length === 0 && (
          <p className="rounded-lg bg-white p-4 text-sm text-gray-400 shadow-sm">
            No sessions yet. Log your first one, or finish a Pomodoro and it lands here automatically.
          </p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 shadow-sm"
          >
            <div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-ink">{s.date}</span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-brand">
                  {s.hours}h
                </span>
                {(s.learnHours > 0 || s.buildHours > 0) && (
                  <span className="text-xs text-gray-400">
                    learn {s.learnHours}h · build {s.buildHours}h
                  </span>
                )}
              </div>
              {s.focus && <p className="mt-1 text-sm text-gray-600">{s.focus}</p>}
            </div>
            <button
              onClick={() => remove(s.id)}
              className="shrink-0 text-xs text-gray-400 hover:text-red-500"
            >
              delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
