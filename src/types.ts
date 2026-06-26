export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY' | 'GBP'

export type Cycle = 'weekly' | 'monthly' | 'yearly'

export type CategoryId = 'ott' | 'music' | 'productivity' | 'shopping' | 'game' | 'news' | 'cloud' | 'etc'

export interface Subscription {
  id: string
  name: string
  amount: number
  currency: Currency
  cycle: Cycle
  nextPayment: string // ISO date yyyy-mm-dd
  category: CategoryId
  memo?: string
  createdAt: number
}

export interface CategoryMeta {
  id: CategoryId
  label: string
  color: string
  emoji: string
}

// Monochrome accent palette: shades of slate (light → dark) for a calm,
// Notion/Linear-style minimal look. Ordering follows typical spend magnitude.
export const CATEGORIES: CategoryMeta[] = [
  { id: 'ott', label: 'OTT·영상', color: '#334155', emoji: '🎬' },
  { id: 'productivity', label: '생산성·AI', color: '#475569', emoji: '⚡' },
  { id: 'music', label: '음악', color: '#64748b', emoji: '🎵' },
  { id: 'shopping', label: '쇼핑·멤버십', color: '#7c8aa0', emoji: '🛍️' },
  { id: 'game', label: '게임', color: '#94a3b8', emoji: '🎮' },
  { id: 'cloud', label: '클라우드·저장', color: '#aab5c4', emoji: '☁️' },
  { id: 'news', label: '뉴스·콘텐츠', color: '#c1cad5', emoji: '📰' },
  { id: 'etc', label: '기타', color: '#d4dae2', emoji: '✨' },
]

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => ((acc[c.id] = c), acc),
  {} as Record<CategoryId, CategoryMeta>,
)

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'KRW', symbol: '₩', label: '원 (KRW)' },
  { code: 'USD', symbol: '$', label: '달러 (USD)' },
  { code: 'EUR', symbol: '€', label: '유로 (EUR)' },
  { code: 'JPY', symbol: '¥', label: '엔 (JPY)' },
  { code: 'GBP', symbol: '£', label: '파운드 (GBP)' },
]

export const CYCLE_LABEL: Record<Cycle, string> = {
  weekly: '주간',
  monthly: '월간',
  yearly: '연간',
}
