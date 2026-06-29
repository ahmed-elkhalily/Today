function MonthCard({ month, onToggle }) {
  const done = month.weeks.filter((w) => w.done).length
  const pct = Math.round((done / month.weeks.length) * 100)

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">{month.title}</h2>
          <p className="text-sm text-gray-500">{month.focus}</p>
        </div>
        <span className="text-sm font-medium text-gray-400">
          {done}/{month.weeks.length}
        </span>
      </div>

      <div className="my-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {month.weeks.map((w) => (
          <li
            key={w.id}
            className={`flex gap-3 rounded-lg border p-3 transition ${
              w.done ? 'border-green-200 bg-green-50' : 'border-gray-100'
            }`}
          >
            <input
              type="checkbox"
              checked={w.done}
              onChange={() => onToggle(month.id, w.id)}
              className="mt-1 h-4 w-4 shrink-0 accent-brand"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {w.week}
                </span>
              </div>
              <p
                className={`text-sm ${
                  w.done ? 'text-gray-400 line-through' : 'text-gray-800'
                }`}
              >
                {w.topic}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                <span className="font-semibold">Build:</span> {w.build}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Curriculum({ curriculum, setCurriculum }) {
  const toggle = (monthId, weekId) =>
    setCurriculum((prev) =>
      prev.map((m) =>
        m.id !== monthId
          ? m
          : {
              ...m,
              weeks: m.weeks.map((w) =>
                w.id === weekId ? { ...w, done: !w.done } : w
              ),
            }
      )
    )

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {curriculum.map((m) => (
        <MonthCard key={m.id} month={m} onToggle={toggle} />
      ))}
    </div>
  )
}
