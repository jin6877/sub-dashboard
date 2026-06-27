import { get, set } from 'idb-keyval'
import type { Currency } from '../types'

export interface RateData {
  // KRW per 1 unit of given currency
  rates: Record<Currency, number>
  updatedAt: number // epoch ms
  source: string
}

const CACHE_KEY = 'subda.rates.v1'
const LEGACY_CACHE_KEY = 'subda.rates.v1' // legacy localStorage key
const TTL = 1000 * 60 * 60 * 8 // 8 hours

// Reasonable hardcoded fallback (₩ per 1 unit). Used offline / on failure.
export const FALLBACK: RateData = {
  rates: { KRW: 1, USD: 1380, EUR: 1490, JPY: 9.1, GBP: 1740 },
  updatedAt: 0,
  source: '기본 환율(오프라인)',
}

const FOREIGN: Exclude<Currency, 'KRW'>[] = ['USD', 'EUR', 'JPY', 'GBP']

function isValidRate(data: unknown): data is RateData {
  return !!(data as RateData)?.rates?.USD
}

/**
 * Load the cached rate from IndexedDB, migrating any legacy localStorage
 * cache on first run.
 */
export async function loadCachedRates(): Promise<RateData | null> {
  try {
    const data = await get<RateData>(CACHE_KEY)
    if (isValidRate(data)) return data
  } catch {
    /* fall through */
  }
  // Migrate legacy localStorage cache once.
  try {
    const raw = localStorage.getItem(LEGACY_CACHE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as unknown
      localStorage.removeItem(LEGACY_CACHE_KEY)
      if (isValidRate(data)) {
        void saveCache(data)
        return data
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

async function saveCache(data: RateData) {
  try {
    await set(CACHE_KEY, data)
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

/**
 * Network-first refresh. On failure (e.g. offline), falls back to the last
 * cached rate (IndexedDB) and finally the hardcoded fallback.
 */
export async function refreshRates(): Promise<RateData> {
  let data: RateData
  try {
    data = await fetchFromErApi()
  } catch {
    try {
      data = await fetchFromFrankfurter()
    } catch {
      const cached = await loadCachedRates()
      return cached ?? FALLBACK
    }
  }
  await saveCache(data)
  return data
}

/**
 * Resolve the initial rate without blocking on the network: cached value if
 * present, otherwise the hardcoded fallback.
 */
export async function getInitialRates(): Promise<RateData> {
  return (await loadCachedRates()) ?? FALLBACK
}
