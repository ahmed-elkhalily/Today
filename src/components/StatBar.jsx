function Stat({ label, value, sub }) {
  return (
    <div className="flex-1 rounded-lg bg-white p-4 shadow-sm">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

export default function StatBar({ totals, goal }) {
  const pct = goal ? Math.min(100, Math.round((totals.hours / goal) * 100)) : 0
  const weekPct = totals.totalWeeks
    ? Math.round((totals.doneWeeks / totals.totalWeeks) * 100)
    : 0

  return (
    <div className="mt-5 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Stat
          label="Hours logged"
          value={`${totals.hours}h`}
          sub={`${pct}% of ${goal}h goal`}
        />
        <Stat
          label="Curriculum done"
          value={`${totals.doneWeeks}/${totals.totalWeeks}`}
          sub={`${weekPct}% of weeks`}
        />
        <Stat
          label="Learn vs Build"
          value={`${totals.learn}h / ${totals.build}h`}
          sub="aim for a roughly even split"
        />
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
