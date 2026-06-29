import { useEffect, useRef, useState } from 'react'

const MODES = {
  work: { label: 'Focus', minutes: 25, color: 'bg-brand' },
  short: { label: 'Short break', minutes: 5, color: 'bg-emerald-500' },
  long: { label: 'Long break', minutes: 15, color: 'bg-indigo-500' },
}

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function Pomodoro({ onComplete }) {
  const [mode, setMode] = useState('work')
  const [secondsLeft, setSecondsLeft] = useState(MODES.work.minutes * 60)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [note, setNote] = useState('')
  const intervalRef = useRef(null)

  const total = MODES[mode].minutes * 60
  const progress = ((total - secondsLeft) / total) * 100

  const switchMode = (next) => {
    setRunning(false)
    setMode(next)
    setSecondsLeft(MODES[next].minutes * 60)
  }

  // Tick
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  // Handle reaching zero
  useEffect(() => {
    if (secondsLeft > 0) return
    setRunning(false)
    if (mode === 'work') {
      onComplete(MODES.work.minutes, note.trim())
      setCompleted((c) => c + 1)
      setNote('')
      // after a focus block, suggest a break
      const next = (completed + 1) % 4 === 0 ? 'long' : 'short'
      switchMode(next)
    } else {
      switchMode('work')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  const reset = () => {
    setRunning(false)
    setSecondsLeft(MODES[mode].minutes * 60)
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
      <div className="mb-5 flex justify-center gap-1">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              mode === key
                ? 'bg-ink text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="relative mx-auto mb-5 flex h-44 w-44 items-center justify-center">
        <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke="#2e6da4" strokeWidth="6"
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(2 * Math.PI * 45 * (100 - progress)) / 100}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="text-4xl font-bold tabular-nums text-ink">
          {fmt(secondsLeft)}
        </span>
      </div>

      {mode === 'work' && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What are you focusing on?"
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-center text-sm focus:border-brand focus:outline-none"
        />
      )}

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`rounded-md px-6 py-2 text-sm font-semibold text-white transition ${
            running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand hover:bg-ink'
          }`}
        >
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Focus blocks completed today: <span className="font-semibold">{completed}</span>
        {' · '}finishing a focus block auto-logs it to your Daily Log.
      </p>
    </div>
  )
}
