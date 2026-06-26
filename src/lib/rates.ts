import type { Currency } from '../types'

export interface RateData {
  // KRW per 1 unit of given currency
  rates: Record<Currency, number>
  updatedAt: number // epoch ms
  source: string
}

const CACHE_KEY = 'subda.rates.v1'
const TTL = 1000 * 60 * 60 * 8 // 8 hours

// Reasonable hardcoded fallback (₩ per 1 unit). Used offline / on failure.
export const FALLBACK: RateData = {
  rates: { KRW: 1, USD: 1380, EUR: 1490, JPY: 9.1, GBP: 1740 },
  updatedAt: 0,
  source: '기본 환율(오프라인)',
}

const FOREIGN: Exclude<Currency, 'KRW'>[] = ['USD', 'EUR', 'JPY', 'GBP']

export function loadCachedRates(): RateData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as RateData
    if (!data?.rates?.USD) return null
    return data
  } catch {
    return null
  }
}

function saveCache(data: RateData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function isStale(data: RateData | null): boolean {
  if (!data) return true
  return Date.now() - data.updatedAt > TTL
}

// Primary: open.er-api.com (base USD, gives KRW etc.)
async function fetchFromErApi(): Promise<RateData> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!res.ok) throw new Error('er-api http ' + res.status)
  const json = await res.json()
  const r = json.rates
  if (!r?.KRW) throw new Error('er-api no KRW')
  const krwPerUsd = r.KRW as number
  const rates: Record<Currency, number> = {
    KRW: 1,
    USD: krwPerUsd,
    EUR: r.EUR ? krwPerUsd / r.EUR : FALLBACK.rates.EUR,
    JPY: r.JPY ? krwPerUsd / r.JPY : FALLBACK.rates.JPY,
    GBP: r.GBP ? krwPerUsd / r.GBP : FALLBACK.rates.GBP,
  }
  return { rates, updatedAt: Date.now(), source: 'open.er-api.com' }
}

// Fallback API: frankfurter.app (one request per currency-> KRW)
async function fetchFromFrankfurter(): Promise<RateData> {
  const rates: Record<Currency, number> = { ...FALLBACK.rates, KRW: 1 }
  const results = await Promise.all(
    FOREIGN.map(async (c) => {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${c}&to=KRW`)
      if (!res.ok) throw new Error('frankfurter http ' + res.status)
      const json = await res.json()
      const v = json?.rates?.KRW
      if (!v) throw new Error('frankfurter no KRW for ' + c)
      return [c, v as number] as const
    }),
  )
  results.forEach(([c, v]) => (rates[c] = v))
  return { rates, updatedAt: Date.now(), source: 'frankfurter.app' }
}

export async function refreshRates(): Promise<RateData> {
  let data: RateData
  try {
    data = await fetchFromErApi()
  } catch {
    try {
      data = await fetchFromFrankfurter()
    } catch {
      const cached = loadCachedRates()
      return cached ?? FALLBACK
    }
  }
  saveCache(data)
  return data
}

// Get rates immediately (cache or fallback) without awaiting network.
export function getInitialRates(): RateData {
  return loadCachedRates() ?? FALLBACK
}
