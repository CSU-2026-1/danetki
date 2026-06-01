import { RefreshCw } from 'lucide-react'
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { getParserStatus, startParser, type ParserStatusResponse } from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import {
  loadParserJobIds,
  rememberParserJobId,
  removeParserJobId,
} from '../lib/parserJobs'
import { cn, formatUnixDate } from '../lib/utils'

const POLL_TERMINAL = new Set(['STATUS_DONE', 'STATUS_FAILED'])

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

function shortJobId(jobId: string): string {
  if (jobId.length <= 12) return jobId
  return `${jobId.slice(0, 8)}…`
}

type ParserPageProps = {
  status: ParserStatusResponse
}

function StatusDetails({ status }: ParserPageProps) {
  return (
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
      {status.started_at > 0 && (
        <div>
          <dt className="text-zinc-500">Запуск</dt>
          <dd className="mt-0.5 text-zinc-200">{formatUnixDate(status.started_at)}</dd>
        </div>
      )}
    </dl>
  )
}

export function ParserPage() {
  const [sourceUrl, setSourceUrl] = useState('https://factroom.ru/')
  const [limit, setLimit] = useState('10')
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [jobsById, setJobsById] = useState<Record<string, ParserStatusResponse>>({})
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pollRef = useRef<number | null>(null)

  const selectedStatus = selectedJobId ? jobsById[selectedJobId] : null

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const upsertJob = useCallback((job: ParserStatusResponse) => {
    setJobsById((prev) => ({ ...prev, [job.job_id]: job }))
    rememberParserJobId(job.job_id)
  }, [])

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling()
      if (!jobId) return

      pollRef.current = window.setInterval(async () => {
        try {
          const data = await getParserStatus(jobId)
          if (!data) return
          upsertJob(data)
          if (POLL_TERMINAL.has(data.status)) {
            stopPolling()
          }
        } catch {
          setError('Не удалось получить статус парсера')
          stopPolling()
        }
      }, 3000)
    },
    [stopPolling, upsertJob],
  )

  const refreshJobs = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsRefreshing(true)
      }
      setError(null)

      const storedIds = loadParserJobIds()
      let ids = [...storedIds]

      try {
        const latest = await getParserStatus()
        if (latest?.job_id) {
          ids = [latest.job_id, ...ids.filter((id) => id !== latest.job_id)]
          rememberParserJobId(latest.job_id)
        }
      } catch {
        if (!options?.silent) {
          setError('Не удалось загрузить историю парсера')
        }
      }

      const uniqueIds = [...new Set(ids)].slice(0, 30)
      const next: Record<string, ParserStatusResponse> = {}

      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const data = await getParserStatus(id)
            if (data) {
              next[id] = data
            } else {
              removeParserJobId(id)
            }
          } catch {
            /* skip failed row */
          }
        }),
      )

      setJobsById((prev) => ({ ...prev, ...next }))
      setSelectedJobId((current) => {
        if (current && next[current]) return current
        const running = uniqueIds.find((id) => next[id]?.status === 'STATUS_RUNNING')
        if (running) return running
        return uniqueIds.find((id) => next[id]) ?? current
      })

      const activeId =
        uniqueIds.find((id) => next[id]?.status === 'STATUS_RUNNING') ??
        uniqueIds.find((id) => next[id])

      if (activeId && next[activeId]?.status === 'STATUS_RUNNING') {
        startPolling(activeId)
      } else {
        stopPolling()
      }

      if (!options?.silent) {
        setIsRefreshing(false)
      }
    },
    [startPolling, stopPolling],
  )

  useEffect(() => {
    void refreshJobs({ silent: true })
    return stopPolling
  }, [refreshJobs, stopPolling])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsStarting(true)
    stopPolling()

    try {
      const parsedLimit = Number.parseInt(limit, 10)
      const response = await startParser(
        Number.isNaN(parsedLimit) ? 0 : parsedLimit,
        sourceUrl.trim(),
      )
      if (!response.job_id) {
        setError('Сервер не вернул идентификатор задачи')
        return
      }

      setSelectedJobId(response.job_id)
      const data = await getParserStatus(response.job_id)
      if (data) {
        upsertJob(data)
        if (data.status === 'STATUS_RUNNING') {
          startPolling(response.job_id)
        }
      }
      await refreshJobs({ silent: true })
    } catch {
      setError('Не удалось запустить парсер')
    } finally {
      setIsStarting(false)
    }
  }

  const jobIds = Object.keys(jobsById).sort(
    (a, b) => (jobsById[b]?.started_at ?? 0) - (jobsById[a]?.started_at ?? 0),
  )

  const hasHistory = jobIds.length > 0

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Парсер</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Запуск сбора историй и генерации данеток
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          isLoading={isRefreshing}
          onClick={() => void refreshJobs()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Обновить
        </Button>
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

      {hasHistory && (
        <Card className="mt-6">
          <h3 className="text-sm font-medium text-zinc-300">История запусков</h3>
          <ul className="mt-3 divide-y divide-zinc-800">
            {jobIds.map((id) => {
              const job = jobsById[id]
              if (!job) return null
              const isSelected = selectedJobId === id

              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJobId(id)
                      if (job.status === 'STATUS_RUNNING') {
                        startPolling(id)
                      } else {
                        stopPolling()
                      }
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 py-3 text-left text-sm transition-colors',
                      isSelected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200',
                    )}
                  >
                    <span className="font-mono text-xs">{shortJobId(id)}</span>
                    <span className={statusClassName(job.status)}>
                      {statusLabel(job.status)}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {formatUnixDate(job.started_at) || '—'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {selectedStatus && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-300">Статус задачи</h3>
            {selectedStatus.status === 'STATUS_RUNNING' && (
              <RefreshCw className="h-4 w-4 animate-spin text-zinc-500" />
            )}
          </div>

          <StatusDetails status={selectedStatus} />

          {selectedStatus.error && (
            <p className="mt-4 text-sm text-red-400">{selectedStatus.error}</p>
          )}
        </Card>
      )}

      {!hasHistory && !selectedStatus && !isRefreshing && (
        <p className="mt-6 text-center text-sm text-zinc-500">
          Запусков пока нет. После первого парсинга история сохранится здесь.
        </p>
      )}
    </div>
  )
}
