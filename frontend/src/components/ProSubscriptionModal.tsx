import { Check, Crown, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/Button'

type ProSubscriptionModalProps = {
  open: boolean
  onClose: () => void
}

const PRO_FEATURES = [
  '100 токенов каждый месяц',
  'Приоритетная генерация',
  'Экспорт в Telegram без ограничений',
  'Поддержка в Telegram-чате',
]

export function ProSubscriptionModal({ open, onClose }: ProSubscriptionModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!open) {
    return null
  }

  function handleClose() {
    setIsSubmitted(false)
    onClose()
  }

  function handleSubscribe() {
    setIsSubmitted(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-indigo-500/20 bg-zinc-900 p-6 shadow-2xl shadow-indigo-950/50"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-zinc-500 transition-colors hover:text-zinc-300"
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/20">
            <Crown className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-white">Подписка Pro</h2>
            <p className="text-sm text-zinc-500">Для контент-мейкеров и пабликов</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-5 text-left">
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-medium text-emerald-200">Заявка принята</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  Интеграция с платёжной системой скоро будет доступна. Мы уведомим вас на email,
                  когда Pro можно будет оплатить онлайн.
                </p>
              </div>
            </div>
            <Button className="mt-5 w-full" onClick={handleClose}>
              Понятно
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-xl border border-white/5 bg-zinc-950/60 px-4 py-4 text-left">
              <p className="text-3xl font-semibold text-white">
                990 ₽
                <span className="text-base font-normal text-zinc-500"> / месяц</span>
              </p>
              <ul className="mt-4 space-y-2">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button className="h-11 w-full rounded-xl text-base" onClick={handleSubscribe}>
              <Crown className="h-4 w-4" />
              Оформить Pro
            </Button>
            <p className="mt-3 text-center text-xs text-zinc-600">
              Демо-режим: оплата будет подключена в следующем релизе
            </p>
          </>
        )}
      </div>
    </div>
  )
}
