import { useEffect, useState } from 'react'
import {
  CATEGORIES,
  CURRENCIES,
  CYCLE_LABEL,
  type Currency,
  type Cycle,
  type CategoryId,
  type Subscription,
} from '../types'
import { uid } from '../lib/storage'

interface Props {
  editing: Subscription | null
  onClose: () => void
  onSave: (sub: Subscription) => void
}

const cycles: Cycle[] = ['monthly', 'yearly', 'weekly']

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function SubForm({ editing, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('KRW')
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [nextPayment, setNextPayment] = useState(todayISO())
  const [category, setCategory] = useState<CategoryId>('ott')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (editing) {
      setName(editing.name)
      setAmount(String(editing.amount))
      setCurrency(editing.currency)
      setCycle(editing.cycle)
      setNextPayment(editing.nextPayment)
      setCategory(editing.category)
      setMemo(editing.memo ?? '')
    }
  }, [editing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!name.trim() || !(amt > 0)) return
    onSave({
      id: editing?.id ?? uid(),
      name: name.trim(),
      amount: amt,
      currency,
      cycle,
      nextPayment,
      category,
      memo: memo.trim() || undefined,
      createdAt: editing?.createdAt ?? Date.now(),
    })
  }

  const field = 'w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-900'
  const label = 'mb-1.5 block text-xs font-medium text-neutral-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">{editing ? '구독 수정' : '구독 추가'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={label}>서비스명</label>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 넷플릭스" autoFocus />
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div>
              <label className={label}>금액</label>
              <input
                className={field}
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                inputMode="decimal"
                placeholder="0"
              />
            </div>
            <div>
              <label className={label}>통화</label>
              <select className={field} value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>결제 주기</label>
            <div className="grid grid-cols-3 gap-2">
              {cycles.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                    cycle === c
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-500 hover:border-neutral-400'
                  }`}
                >
                  {CYCLE_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>다음 결제일</label>
            <input
              type="date"
              className={field}
              value={nextPayment}
              onChange={(e) => setNextPayment(e.target.value)}
            />
          </div>

          <div>
            <label className={label}>카테고리</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium transition ${
                    category === c.id
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-500 hover:border-neutral-400'
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>메모 (선택)</label>
            <input className={field} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="요금제, 공유 인원 등" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-neutral-300 bg-white py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-[2] rounded-lg bg-neutral-900 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            {editing ? '저장' : '추가하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
