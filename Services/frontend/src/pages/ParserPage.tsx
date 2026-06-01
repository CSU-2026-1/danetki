import { RefreshCw } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { getParserStatus, startParser, type ParserStatusResponse } from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'

const TERMINAL_STATUSES = new Set(['STATUS_DONE', 'STATUS_FAILED'])

const STATUS_LABELS: Record<string, string> = {
  STATUS_RUNNING: 'В работе',
  STATUS_DONE: 'Готово',
  STATUS_FAILED: 'Ошибка',
  STATUS_UNKNOWN: 'Неизвестно',
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

function statusClassName(status: string): string {
  switch (status) {
    case 'STATUS_RUNNING':
      return 'text-amber-400'
    case 'STATUS_DONE':
      return 'text-emerald-400'
    case 'STATUS_FAILED':
      return 'text-red-400'
    default:
      return 'text-zinc-400'
  }
}

export function ParserPage() {
  const [sourceUrl, setSourceUrl] = useState('https://factroom.ru/')
  const [limit, setLimit] = useState('10')
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<ParserStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const pollRef = useRef<number | null>(null)

  const pollStatus = useCallback(async (id: string) => {
    try {
      const data = await getParserStatus(id)
      setStatus(data)

      if (TERMINAL_STATUSES.has(data.status)) {
        if (pollRef.current) {
          window.clearInterval(pollRef.current)
          pollRef.current = null
        }
      }
    } catch {
      setError('Не удалось получить статус парсера')
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
      }
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsStarting(true)
    setStatus(null)

    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }

    try {
      const parsedLimit = Number.parseInt(limit, 10)
      const response = await startParser(
        Number.isNaN(parsedLimit) ? 0 : parsedLimit,
        sourceUrl.trim(),
      )
      setJobId(response.job_id)
      await pollStatus(response.job_id)
      pollRef.current = window.setInterval(() => pollStatus(response.job_id), 3000)
    } catch {
      setError('Не удалось запустить парсер')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Парсер</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Запуск сбора историй и генерации данеток
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="source_url" className="text-sm font-medium text-zinc-300">
              URL источника
            </label>
            <Input
              id="source_url"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://factroom.ru/"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="limit" className="text-sm font-medium text-zinc-300">
              Лимит историй
            </label>
            <Input
              id="limit"
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" isLoading={isStarting}>
            Запустить парсинг
          </Button>
        </form>
      </Card>

      {status && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Статус задачи</h3>
            {jobId && !TERMINAL_STATUSES.has(status.status) && (
              <RefreshCw className="h-4 w-4 animate-spin text-zinc-500" />
            )}
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Job ID</dt>
              <dd className="mt-0.5 truncate font-mono text-xs text-zinc-300">{status.job_id}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Статус</dt>
              <dd className={cn('mt-0.5 font-medium', statusClassName(status.status))}>
                {statusLabel(status.status)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Найдено</dt>
              <dd className="mt-0.5 text-zinc-200">{status.total_found}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">В очереди</dt>
              <dd className="mt-0.5 text-zinc-200">{status.total_queued}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Пропущено</dt>
              <dd className="mt-0.5 text-zinc-200">{status.total_skipped}</dd>
            </div>
          </dl>

          {status.error && (
            <p className="mt-4 text-sm text-red-400">{status.error}</p>
          )}
        </Card>
      )}
    </div>
  )
}
