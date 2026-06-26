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

  const field = 'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:bg-white/10'
  const label = 'mb-1.5 block text-xs font-semibold text-slate-400'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-[#14132b] p-6 shadow-2xl shadow-indigo-950/50 sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{editing ? '구독 수정' : '구독 추가'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
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
                  <option key={c.code} value={c.code} className="bg-[#14132b]">
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
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    cycle === c
                      ? 'border-indigo-400 bg-indigo-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
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
              className={`${field} [color-scheme:dark]`}
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
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-medium transition ${
                    category === c.id ? 'border-transparent text-white' : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                  style={category === c.id ? { background: c.color + '33', borderColor: c.color } : undefined}
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
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-[2] rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-fuchsia-400"
          >
            {editing ? '저장' : '추가하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
