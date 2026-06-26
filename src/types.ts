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

export const CATEGORIES: CategoryMeta[] = [
  { id: 'ott', label: 'OTT·영상', color: '#6366f1', emoji: '🎬' },
  { id: 'music', label: '음악', color: '#ec4899', emoji: '🎵' },
  { id: 'productivity', label: '생산성·AI', color: '#22d3ee', emoji: '⚡' },
  { id: 'shopping', label: '쇼핑·멤버십', color: '#f59e0b', emoji: '🛍️' },
  { id: 'game', label: '게임', color: '#a855f7', emoji: '🎮' },
  { id: 'news', label: '뉴스·콘텐츠', color: '#14b8a6', emoji: '📰' },
  { id: 'cloud', label: '클라우드·저장', color: '#3b82f6', emoji: '☁️' },
  { id: 'etc', label: '기타', color: '#94a3b8', emoji: '✨' },
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
