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

const ACCENT = '#4f46e5'

type SortKey = 'date' | 'amount'

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
  const [sortKey, setSortKey] = useState<SortKey>('date')

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

  const tableRows = useMemo(() => {
    const arr = [...subs]
    if (sortKey === 'amount') arr.sort((a, b) => toMonthlyKRW(b, rates) - toMonthlyKRW(a, rates))
    else arr.sort((a, b) => daysUntil(a.nextPayment) - daysUntil(b.nextPayment))
    return arr
  }, [subs, rates, sortKey])

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
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-7 sm:px-6 sm:pt-10">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-lg text-white">
              📊
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">구독다</h1>
              <p className="text-xs text-neutral-500">내 구독, 1년이면 얼마?</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="hidden items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 sm:flex"
          >
            <span className="text-base leading-none">＋</span> 구독 추가
          </button>
        </header>

        {/* Summary cards */}
        <section className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:col-span-1">
            <p className="text-xs font-medium text-neutral-500">이번 달 총 구독료</p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight text-neutral-900">{formatKRW(monthlyTotal)}</p>
            <p className="mt-1 text-sm text-neutral-500">
              연 {formatKRW(yearlyTotal)} · {subs.length}개
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-neutral-500">다음 결제 예정</p>
            {nextPay ? (
              <div className="mt-2 flex items-center gap-2.5">
                <span className="text-lg">{CATEGORY_MAP[nextPay.category].emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{nextPay.name}</p>
                  <p className="text-xs text-neutral-500">
                    {formatDate(nextPay.nextPayment)} · {formatKRW(toKRW(nextPay.amount, nextPay.currency, rates))}
                  </p>
                </div>
                <DdayBadge days={daysUntil(nextPay.nextPayment)} small />
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-400">등록된 구독 없음</p>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-neutral-500">가장 비싼 구독</p>
            {mostExpensive ? (
              <div className="mt-2 flex items-center gap-2.5">
                <span className="text-lg">{CATEGORY_MAP[mostExpensive.category].emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{mostExpensive.name}</p>
                  <p className="text-xs text-neutral-500">{formatKRW(toMonthlyKRW(mostExpensive, rates))}/월</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-400">—</p>
            )}
          </div>
        </section>

        {subs.length > 0 && (
          <p className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500">
            <span>💸</span> {funFact(yearlyTotal)}
          </p>
        )}

        {/* Exchange rate bar */}
        <RateBar rates={rates} loading={loadingRates} onRefresh={doRefresh} hasForeign={hasForeign} />

        {/* Chart + Timeline */}
        <section className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">카테고리별 지출 비중</h2>
            {catSlices.length > 0 ? (
              <DonutChart slices={catSlices} centerTop="월 합계" centerBottom={formatKRWShort(monthlyTotal) + '원'} />
            ) : (
              <p className="py-10 text-center text-sm text-neutral-400">구독을 추가하면 차트가 나타나요</p>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700">다가오는 결제 타임라인</h2>
            <ul className="space-y-1">
              {sortedByDate.slice(0, 6).map((s) => {
                const d = daysUntil(s.nextPayment)
                const meta = CATEGORY_MAP[s.category]
                return (
                  <li key={s.id} className="flex items-center gap-3 py-1">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                    <span className="w-14 shrink-0 text-xs text-neutral-400">{formatDate(s.nextPayment)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{s.name}</span>
                    <span className="shrink-0 text-sm font-medium text-neutral-600">
                      {formatKRW(toKRW(s.amount, s.currency, rates))}
                    </span>
                    <DdayBadge days={d} small />
                  </li>
                )
              })}
              {sortedByDate.length === 0 && <li className="py-6 text-center text-sm text-neutral-400">예정된 결제 없음</li>}
            </ul>
          </div>
        </section>

        {/* Table */}
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">전체 구독 ({subs.length})</h2>
            {subs.length > 0 && (
              <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-0.5 text-xs">
                <SortTab active={sortKey === 'date'} onClick={() => setSortKey('date')}>결제일순</SortTab>
                <SortTab active={sortKey === 'amount'} onClick={() => setSortKey('amount')}>금액순</SortTab>
              </div>
            )}
          </div>

          {subs.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium text-neutral-500">
                      <th className="px-4 py-3 font-medium">서비스</th>
                      <th className="px-4 py-3 text-right font-medium">금액 (월 환산)</th>
                      <th className="px-4 py-3 font-medium">주기</th>
                      <th className="px-4 py-3 font-medium">다음 결제일</th>
                      <th className="px-4 py-3 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((s) => {
                      const meta = CATEGORY_MAP[s.category]
                      const monthly = toMonthlyKRW(s, rates)
                      const d = daysUntil(s.nextPayment)
                      const cur = CURRENCIES.find((c) => c.code === s.currency)!
                      const krwOnce = toKRW(s.amount, s.currency, rates)
                      return (
                        <tr key={s.id} className="group border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50">
                          {/* Service + category */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="shrink-0 text-base">{meta.emoji}</span>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-neutral-900">{s.name}</p>
                                <span className="text-[11px] text-neutral-400">{meta.label}</span>
                              </div>
                            </div>
                          </td>
                          {/* Amount */}
                          <td className="px-4 py-3 text-right">
                            <p className="font-medium text-neutral-900">{formatKRW(monthly)}</p>
                            {s.currency !== 'KRW' && (
                              <p className="text-[11px] text-neutral-400">
                                {cur.symbol}{s.amount.toLocaleString('ko-KR')} → {formatKRW(krwOnce)}
                              </p>
                            )}
                          </td>
                          {/* Cycle */}
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                              {CYCLE_LABEL[s.cycle]}
                            </span>
                          </td>
                          {/* Next payment + D-day */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-700">{formatDate(s.nextPayment)}</span>
                              <DdayBadge days={d} small />
                            </div>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
                              <button
                                onClick={() => openEdit(s)}
                                className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => remove(s.id)}
                                className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
              <p className="text-neutral-500">아직 등록된 구독이 없어요</p>
              <button
                onClick={openAdd}
                className="mt-4 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
              >
                첫 구독 추가하기
              </button>
            </div>
          )}
        </section>

        <footer className="mt-10 text-center text-xs text-neutral-400">
          모든 데이터는 브라우저에만 저장됩니다 · 서버 전송 없음
        </footer>
      </div>

      {/* FAB (mobile) */}
      <button
        onClick={openAdd}
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-2xl text-white shadow-lg transition active:scale-95 sm:hidden"
      >
        ＋
      </button>

      {formOpen && <SubForm editing={editing} onClose={() => setFormOpen(false)} onSave={upsert} />}
    </div>
  )
}

function SortTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 font-medium transition ${
        active ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
      }`}
    >
      {children}
    </button>
  )
}

function DdayBadge({ days, small }: { days: number; small?: boolean }) {
  const text = days === 0 ? '오늘' : days < 0 ? `${-days}일 지남` : `D-${days}`
  const urgent = days <= 3 && days >= 0
  const cls = urgent
    ? 'bg-red-50 text-red-600'
    : days < 0
      ? 'bg-neutral-100 text-neutral-400'
      : 'bg-neutral-100 text-neutral-600'
  return (
    <span className={`shrink-0 rounded-full font-medium ${cls} ${small ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm'}`}>
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs shadow-sm">
      <span className="font-medium text-neutral-700">💱 환율 기준</span>
      <span className="text-neutral-500">
        $1 = <span className="font-semibold text-neutral-900">₩{Math.round(rates.rates.USD).toLocaleString('ko-KR')}</span>
        <span className="ml-2 hidden sm:inline">
          · €1 = ₩{Math.round(rates.rates.EUR).toLocaleString('ko-KR')} · ¥100 = ₩
          {Math.round(rates.rates.JPY * 100).toLocaleString('ko-KR')}
        </span>
      </span>
      <span className="text-neutral-400">({rates.source} · {timeAgo(rates.updatedAt)})</span>
      {!hasForeign && <span className="text-neutral-400">· 외화 구독 없음</span>}
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{ color: ACCENT }}
        className="ml-auto flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 font-medium transition hover:bg-neutral-50 disabled:opacity-50"
      >
        <span className={loading ? 'inline-block animate-spin' : ''}>↻</span>
        {loading ? '갱신 중' : '환율 새로고침'}
      </button>
    </div>
  )
}
