import { useState } from 'react'
import { formatKRWShort } from '../lib/calc'

export interface DonutSlice {
  key: string
  label: string
  value: number
  color: string
  emoji?: string
}

interface Props {
  slices: DonutSlice[]
  centerTop: string
  centerBottom: string
}

const SIZE = 200
const STROKE = 30
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

export default function DonutChart({ slices, centerTop, centerBottom }: Props) {
  const [active, setActive] = useState<string | null>(null)
  const total = slices.reduce((s, x) => s + x.value, 0)
  let offset = 0

  const activeSlice = slices.find((s) => s.key === active)

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#1e1b3a" strokeWidth={STROKE} />
          {total > 0 &&
            slices.map((s) => {
              const frac = s.value / total
              const len = frac * C
              const dash = `${len} ${C - len}`
              const dashoffset = -offset
              offset += len
              const dim = active && active !== s.key
              return (
                <circle
                  key={s.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={active === s.key ? STROKE + 6 : STROKE}
                  strokeDasharray={dash}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="butt"
                  className="cursor-pointer transition-all duration-300"
                  style={{ opacity: dim ? 0.25 : 1 }}
                  onMouseEnter={() => setActive(s.key)}
                  onMouseLeave={() => setActive(null)}
                />
              )
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {activeSlice ? (
            <>
              <span className="text-xs font-medium text-slate-400">
                {activeSlice.emoji} {activeSlice.label}
              </span>
              <span className="mt-0.5 text-lg font-bold text-white">{formatKRWShort(activeSlice.value)}원</span>
              <span className="text-xs text-indigo-300">{Math.round((activeSlice.value / total) * 100)}%</span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-slate-400">{centerTop}</span>
              <span className="mt-0.5 bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-xl font-extrabold text-transparent">
                {centerBottom}
              </span>
            </>
          )}
        </div>
      </div>

      <ul className="grid w-full grid-cols-1 gap-1.5 sm:max-w-[260px]">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
          return (
            <li
              key={s.key}
              onMouseEnter={() => setActive(s.key)}
              onMouseLeave={() => setActive(null)}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                active === s.key ? 'bg-white/5' : ''
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate text-slate-200">
                {s.emoji} {s.label}
              </span>
              <span className="ml-auto shrink-0 font-semibold text-slate-300">{pct}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
