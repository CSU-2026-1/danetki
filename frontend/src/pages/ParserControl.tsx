import { type FormEvent, useEffect, useState } from 'react'
import { getParserStatus, startParser, type ParserStatusResponse } from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

const TERMINAL_STATUSES = new Set(['STATUS_DONE', 'STATUS_FAILED'])

export function ParserControl() {
  const [sourceUrl, setSourceUrl] = useState('https://factroom.ru/')
  const [limit, setLimit] = useState('10')
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<ParserStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    if (!jobId) return

    let active = true

    async function poll() {
      try {
        const next = await getParserStatus(jobId!)
        if (active) {
          setStatus(next)
          setError(null)
        }
      } catch {
        if (active) setError('Не удалось получить статус парсера')
      }
    }

    poll()
    const timer = window.setInterval(poll, 3000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [jobId])

  async function handleStart(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsStarting(true)
    setStatus(null)

    try {
      const response = await startParser(Number(limit), sourceUrl)
      setJobId(response.job_id)
    } catch {
      setError('Не удалось запустить парсер')
    } finally {
      setIsStarting(false)
    }
  }

  const progress =
    status && status.total_found > 0
      ? Math.min(100, Math.round((status.total_queued / status.total_found) * 100))
      : 0

  const isRunning = status && !TERMINAL_STATUSES.has(status.status)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Парсер</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Сбор историй и постановка задач в очередь Kafka
        </p>
      </div>

      <Card>
        <form onSubmit={handleStart} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="sourceUrl" className="text-sm font-medium text-zinc-300">
              URL источника
            </label>
            <Input
              id="sourceUrl"
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
              max={100}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" isLoading={isStarting} disabled={Boolean(isRunning)}>
            Запустить
          </Button>
        </form>
      </Card>

      {status && (
        <Card className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Job ID</span>
            <span className="font-mono text-zinc-200">{status.job_id}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Статус</span>
            <span className="text-zinc-200">{status.status}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Найдено: {status.total_found}</span>
              <span>В очереди: {status.total_queued}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {status.error && (
            <p className="text-sm text-red-400">{status.error}</p>
          )}
        </Card>
      )}
    </div>
  )
}
