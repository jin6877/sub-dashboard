import { get, set } from 'idb-keyval'
import type { Subscription } from '../types'

const SUBS_KEY = 'subda.subscriptions.v1'
// Legacy localStorage key (same name) — read once for migration.
const LEGACY_SUBS_KEY = 'subda.subscriptions.v1'

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function isValidSubs(data: unknown): data is Subscription[] {
  return Array.isArray(data)
}

/**
 * Load subscriptions from IndexedDB.
 * On first run after the localStorage→IndexedDB migration, any existing
 * localStorage data is copied over once so no data is lost.
 * Returns seed data only when there is truly no prior data anywhere.
 */
export async function loadSubs(): Promise<Subscription[]> {
  try {
    const idbData = await get<Subscription[]>(SUBS_KEY)
    if (isValidSubs(idbData)) return idbData
  } catch {
    /* fall through to migration / seed */
  }

  // Migrate from legacy localStorage if present.
  const migrated = migrateFromLocalStorage()
  if (migrated) {
    // Persist the migrated data into IndexedDB immediately.
    void saveSubs(migrated)
    return migrated
  }

  return seed()
}

function migrateFromLocalStorage(): Subscription[] | null {
  try {
    const raw = localStorage.getItem(LEGACY_SUBS_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (!isValidSubs(data)) return null
    // Remove the legacy entry so we don't migrate again.
    localStorage.removeItem(LEGACY_SUBS_KEY)
    return data
  } catch {
    return null
  }
}

export async function saveSubs(subs: Subscription[]): Promise<void> {
  try {
    await set(SUBS_KEY, subs)
  } catch {
    /* ignore — storage may be unavailable */
  }
}

function future(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

// First-run sample data so the dashboard isn't empty.
function seed(): Subscription[] {
  const now = Date.now()
  return [
    { id: uid(), name: '넷플릭스', amount: 13500, currency: 'KRW', cycle: 'monthly', nextPayment: future(4), category: 'ott', memo: '프리미엄', createdAt: now },
    { id: uid(), name: '유튜브 프리미엄', amount: 14900, currency: 'KRW', cycle: 'monthly', nextPayment: future(11), category: 'ott', createdAt: now + 1 },
    { id: uid(), name: 'ChatGPT Plus', amount: 20, currency: 'USD', cycle: 'monthly', nextPayment: future(2), category: 'productivity', memo: '실시간 환율 환산', createdAt: now + 2 },
    { id: uid(), name: '멜론', amount: 10900, currency: 'KRW', cycle: 'monthly', nextPayment: future(18), category: 'music', createdAt: now + 3 },
    { id: uid(), name: '쿠팡 와우', amount: 7890, currency: 'KRW', cycle: 'monthly', nextPayment: future(25), category: 'shopping', createdAt: now + 4 },
    { id: uid(), name: 'Spotify', amount: 11990, currency: 'KRW', cycle: 'monthly', nextPayment: future(8), category: 'music', createdAt: now + 5 },
    { id: uid(), name: 'iCloud+', amount: 1100, currency: 'KRW', cycle: 'monthly', nextPayment: future(14), category: 'cloud', createdAt: now + 6 },
    { id: uid(), name: 'Notion Plus', amount: 10, currency: 'USD', cycle: 'monthly', nextPayment: future(20), category: 'productivity', createdAt: now + 7 },
  ]
}
