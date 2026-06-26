import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORY_MAP,
  CATEGORIES,
  CURRENCIES,
  CYCLE_LABEL,
  type Subscription,
} from './types'
import { loadSubs, saveSubs } from './lib/storage'
import {
  daysUntil,
  formatDate,
  formatKRW,
  formatKRWShort,
  funFact,
  normalizedNextPayment,
  toKRW,
  toMonthlyKRW,
} from './lib/calc'
import { getInitialRates, isStale, refreshRates, type RateData } from './lib/rates'
import DonutChart, { type DonutSlice } from './components/DonutChart'
import SubForm from './components/SubForm'

function timeAgo(ms: number): string {
  if (!ms) return '오프라인 기본값'
  const diff = Date.now() - ms
  const min = Math.round(diff / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.round(h / 24)}일 전`
}

export default function App() {
  const [subs, setSubs] = useState<Subscription[]>(() => loadSubs())
  const [rates, setRates] = useState<RateData>(() => getInitialRates())
  const [loadingRates, setLoadingRates] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  useEffect(() => saveSubs(subs), [subs])

  const doRefresh = async () => {
    setLoadingRates(true)
    const data = await refreshRates()
    setRates(data)
    setLoadingRates(false)
  }

  useEffect(() => {
    if (isStale(rates)) doRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Normalize past payment dates forward on load.
  useEffect(() => {
    setSubs((prev) => {
      let changed = false
      const next = prev.map((s) => {
        const np = normalizedNextPayment(s)
        if (np !== s.nextPayment) {
          changed = true
          return { ...s, nextPayment: np }
        }
        return s
      })
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const monthlyTotal = useMemo(
    () => subs.reduce((sum, s) => sum + toMonthlyKRW(s, rates), 0),
    [subs, rates],
  )
  const yearlyTotal = monthlyTotal * 12

  const sortedByDate = useMemo(
    () => [...subs].sort((a, b) => daysUntil(a.nextPayment) - daysUntil(b.nextPayment)),
    [subs],
  )
  const nextPay = sortedByDate[0]

  const mostExpensive = useMemo(() => {
    if (subs.length === 0) return null
    return [...subs].sort((a, b) => toMonthlyKRW(b, rates) - toMonthlyKRW(a, rates))[0]
  }, [subs, rates])

  const catSlices: DonutSlice[] = useMemo(() => {
    const map = new Map<string, number>()
    subs.forEach((s) => {
      map.set(s.category, (map.get(s.category) ?? 0) + toMonthlyKRW(s, rates))
    })
    return CATEGORIES.filter((c) => map.has(c.id))
      .map((c) => ({ key: c.id, label: c.label, value: map.get(c.id)!, color: c.color, emoji: c.emoji }))
      .sort((a, b) => b.value - a.value)
  }, [subs, rates])

  const hasForeign = subs.some((s) => s.currency !== 'KRW')

  const upsert = (sub: Subscription) => {
    setSubs((prev) => {
      const idx = prev.findIndex((s) => s.id === sub.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = sub
        return copy
      }
      return [...prev, sub]
    })
    setFormOpen(false)
    setEditing(null)
  }

  const remove = (id: string) => setSubs((prev) => prev.filter((s) => s.id !== id))

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (s: Subscription) => {
    setEditing(s)
    setFormOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#0b0a1a] text-white">
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-7 sm:px-6 sm:pt-10">
        {/* Header */}
        <header className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl shadow-lg shadow-indigo-900/40">
              📊
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">구독다</h1>
              <p className="text-xs text-slate-400">내 구독, 1년이면 얼마?</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-fuchsia-400 sm:flex"
          >
            <span className="text-base">＋</span> 구독 추가
          </button>
        </header>

        {/* Hero summary */}
        <section className="mb-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-violet-700/20 to-fuchsia-600/20 p-6 sm:p-7">
            <p className="text-sm font-medium text-indigo-200">이번 달 총 구독료 (원화 환산)</p>
            <p className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">{formatKRW(monthlyTotal)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-black/30 px-3 py-1 text-sm font-semibold text-fuchsia-200">
                연 {formatKRW(yearlyTotal)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">{subs.length}개 구독</span>
            </div>
            {subs.length > 0 && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black/25 px-3 py-2 text-sm font-medium text-amber-200">
                💸 {funFact(yearlyTotal)}
              </p>
            )}
          </div>

          {/* Next payment */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-semibold text-slate-400">다음 결제 예정</p>
              {nextPay ? (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl" style={{ background: CATEGORY_MAP[nextPay.category].color + '33' }}>
                    {CATEGORY_MAP[nextPay.category].emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{nextPay.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(nextPay.nextPayment)} · {formatKRW(toKRW(nextPay.amount, nextPay.currency, rates))}
                    </p>
                  </div>
                  <DdayBadge days={daysUntil(nextPay.nextPayment)} />
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">등록된 구독이 없어요</p>
              )}
            </div>

            {mostExpensive && (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-500/[0.06] p-5">
                <p className="text-xs font-semibold text-amber-300/80">👑 가장 비싼 구독</p>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="truncate font-bold">{mostExpensive.name}</span>
                  <span className="shrink-0 font-bold text-amber-200">{formatKRW(toMonthlyKRW(mostExpensive, rates))}/월</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Exchange rate bar */}
        <RateBar rates={rates} loading={loadingRates} onRefresh={doRefresh} hasForeign={hasForeign} />

        {/* Chart + Timeline */}
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-300">카테고리별 지출 비중</h2>
            {catSlices.length > 0 ? (
              <DonutChart slices={catSlices} centerTop="월 합계" centerBottom={formatKRWShort(monthlyTotal) + '원'} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">구독을 추가하면 차트가 나타나요</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-300">다가오는 결제 타임라인</h2>
            <ul className="space-y-2">
              {sortedByDate.slice(0, 6).map((s) => {
                const d = daysUntil(s.nextPayment)
                const meta = CATEGORY_MAP[s.category]
                return (
                  <li key={s.id} className="flex items-center gap-3">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                    <span className="w-14 shrink-0 text-xs text-slate-400">{formatDate(s.nextPayment)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{s.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-slate-300">
                      {formatKRW(toKRW(s.amount, s.currency, rates))}
                    </span>
                    <DdayBadge days={d} small />
                  </li>
                )
              })}
              {sortedByDate.length === 0 && <li className="py-6 text-center text-sm text-slate-500">예정된 결제 없음</li>}
            </ul>
          </div>
        </section>

        {/* List */}
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300">전체 구독 ({subs.length})</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {subs.map((s) => {
              const meta = CATEGORY_MAP[s.category]
              const monthly = toMonthlyKRW(s, rates)
              const d = daysUntil(s.nextPayment)
              const cur = CURRENCIES.find((c) => c.code === s.currency)!
              return (
                <div
                  key={s.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: meta.color + '2e' }}>
                      {meta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold">{s.name}</p>
                        {s.currency !== 'KRW' && (
                          <span className="shrink-0 rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-200">
                            {cur.symbol}{s.currency}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {cur.symbol}{s.amount.toLocaleString('ko-KR')} · {CYCLE_LABEL[s.cycle]} · {formatDate(s.nextPayment)}
                      </p>
                      {s.memo && <p className="mt-1 truncate text-xs text-slate-500">{s.memo}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{formatKRW(monthly)}</p>
                      <p className="text-[11px] text-slate-500">월 환산</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <DdayBadge days={d} small />
                    <div className="flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => openEdit(s)} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10">
                        수정
                      </button>
                      <button onClick={() => remove(s.id)} className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/20">
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {subs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
              <p className="text-slate-400">아직 등록된 구독이 없어요</p>
              <button onClick={openAdd} className="mt-4 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-bold hover:bg-indigo-400">
                첫 구독 추가하기
              </button>
            </div>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-slate-600">
          모든 데이터는 브라우저에만 저장됩니다 · 서버 전송 없음
        </footer>
      </div>

      {/* FAB (mobile) */}
      <button
        onClick={openAdd}
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl shadow-xl shadow-fuchsia-900/50 transition active:scale-95 sm:hidden"
      >
        ＋
      </button>

      {formOpen && <SubForm editing={editing} onClose={() => setFormOpen(false)} onSave={upsert} />}
    </div>
  )
}

function DdayBadge({ days, small }: { days: number; small?: boolean }) {
  const text = days === 0 ? '오늘' : days < 0 ? `${-days}일 지남` : `D-${days}`
  const urgent = days <= 3 && days >= 0
  const cls = urgent
    ? 'bg-rose-500/20 text-rose-200'
    : days < 0
      ? 'bg-slate-600/30 text-slate-400'
      : 'bg-indigo-500/15 text-indigo-200'
  return (
    <span className={`shrink-0 rounded-full font-bold ${cls} ${small ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm'}`}>
      {text}
    </span>
  )
}

function RateBar({
  rates,
  loading,
  onRefresh,
  hasForeign,
}: {
  rates: RateData
  loading: boolean
  onRefresh: () => void
  hasForeign: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs">
      <span className="font-semibold text-slate-300">💱 환율 기준</span>
      <span className="text-slate-400">
        $1 = <span className="font-bold text-white">₩{Math.round(rates.rates.USD).toLocaleString('ko-KR')}</span>
        <span className="ml-2 hidden sm:inline">
          · €1 = ₩{Math.round(rates.rates.EUR).toLocaleString('ko-KR')} · ¥100 = ₩
          {Math.round(rates.rates.JPY * 100).toLocaleString('ko-KR')}
        </span>
      </span>
      <span className="text-slate-500">({rates.source} · {timeAgo(rates.updatedAt)})</span>
      {!hasForeign && <span className="text-slate-600">· 외화 구독 없음</span>}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
      >
        <span className={loading ? 'inline-block animate-spin' : ''}>↻</span>
        {loading ? '갱신 중' : '환율 새로고침'}
      </button>
    </div>
  )
}
