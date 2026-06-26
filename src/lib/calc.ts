import type { Cycle, Currency, Subscription } from '../types'
import type { RateData } from './rates'

// Convert any subscription amount to monthly KRW.
export function toMonthlyKRW(sub: Subscription, rates: RateData): number {
  const krw = sub.amount * (rates.rates[sub.currency] ?? 1)
  return cycleToMonthly(krw, sub.cycle)
}

export function cycleToMonthly(amount: number, cycle: Cycle): number {
  switch (cycle) {
    case 'weekly':
      return (amount * 52) / 12
    case 'yearly':
      return amount / 12
    case 'monthly':
    default:
      return amount
  }
}

export function toKRW(amount: number, currency: Currency, rates: RateData): number {
  return amount * (rates.rates[currency] ?? 1)
}

export function daysUntil(dateISO: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(dateISO + 'T00:00:00')
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

// Roll a past next-payment date forward to the next future occurrence.
export function normalizedNextPayment(sub: Subscription): string {
  const d = new Date(sub.nextPayment + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let guard = 0
  while (d.getTime() < today.getTime() && guard < 600) {
    if (sub.cycle === 'weekly') d.setDate(d.getDate() + 7)
    else if (sub.cycle === 'yearly') d.setFullYear(d.getFullYear() + 1)
    else d.setMonth(d.getMonth() + 1)
    guard++
  }
  return d.toISOString().slice(0, 10)
}

export function formatKRW(n: number): string {
  return '₩' + Math.round(n).toLocaleString('ko-KR')
}

export function formatKRWShort(n: number): string {
  const v = Math.round(n)
  if (v >= 100000000) return (v / 100000000).toFixed(1).replace(/\.0$/, '') + '억'
  if (v >= 10000) return Math.round(v / 10000).toLocaleString('ko-KR') + '만'
  return v.toLocaleString('ko-KR')
}

export function formatDate(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

// Witty "this much money could buy..." comparisons based on yearly KRW.
export function funFact(yearlyKRW: number): string {
  const y = yearlyKRW
  const items: { unit: number; label: string }[] = [
    { unit: 4500, label: '☕ 아메리카노' },
    { unit: 13000, label: '🍗 치킨' },
    { unit: 60000, label: '👟 운동화' },
    { unit: 1200000, label: '✈️ 제주도 항공권(왕복)' },
  ]
  // pick the largest item where count >= 2
  for (let i = items.length - 1; i >= 0; i--) {
    const cnt = Math.floor(y / items[i].unit)
    if (cnt >= 2) return `1년이면 ${items[i].label} ${cnt.toLocaleString('ko-KR')}개 값`
  }
  const cnt = Math.max(1, Math.floor(y / items[0].unit))
  return `1년이면 ${items[0].label} ${cnt.toLocaleString('ko-KR')}잔 값`
}
