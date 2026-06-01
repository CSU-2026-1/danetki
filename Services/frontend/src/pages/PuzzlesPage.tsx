import { ChevronLeft, ChevronRight, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllPuzzles, getPuzzleHidden, type Puzzle } from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { cn, formatUnixDate } from '../lib/utils'

const PAGE_SIZE = 10

type PuzzleCardProps = {
  puzzle: Puzzle
  onOpen: () => void
}

function PuzzleCard({ puzzle, onOpen }: PuzzleCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [hiddenPart, setHiddenPart] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [answerNotice, setAnswerNotice] = useState<string | null>(null)

  async function toggleAnswer() {
    if (revealed) {
      setRevealed(false)
      return
    }

    if (hiddenPart) {
      setRevealed(true)
      setAnswerNotice(null)
      return
    }

    setIsLoading(true)
    setAnswerNotice(null)

    try {
      const data = await getPuzzleHidden(puzzle.puzzle_id)
      setHiddenPart(data.hidden_part)
      setRevealed(true)
    } catch {
      setAnswerNotice('Ответ пока недоступен')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card
      className="flex cursor-pointer flex-col justify-between transition-all duration-200 hover:border-zinc-700/80"
      onClick={onOpen}
    >
      <div>
        <p className="text-sm leading-relaxed text-zinc-200">{puzzle.open_part}</p>

        {revealed && hiddenPart && (
          <div className="mt-3 rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-3 py-2">
            <p className="text-sm leading-relaxed text-amber-200/90">{hiddenPart}</p>
          </div>
        )}

        {answerNotice && (
          <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-200/80">
            {answerNotice}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-zinc-500">{formatUnixDate(puzzle.created_at)}</p>
          {puzzle.source_url ? (
            <a
              href={puzzle.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-xs text-indigo-400 hover:text-indigo-300"
              title={puzzle.source_url}
              onClick={(e) => e.stopPropagation()}
            >
              Источник
            </a>
          ) : (
            <p className="text-xs text-zinc-600">Источник не указан</p>
          )}
        </div>

        <Button
          variant="secondary"
          className="h-8 shrink-0 px-3 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            void toggleAnswer()
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            'Загрузка...'
          ) : revealed ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              Скрыть ответ
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Узнать ответ
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

export function PuzzlesPage() {
  const navigate = useNavigate()
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const loadPuzzles = useCallback(async (targetPage: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getAllPuzzles(targetPage, PAGE_SIZE)
      setPuzzles(data.puzzles ?? [])
      setTotal(data.total ?? 0)
      setPage(data.page ?? targetPage)
    } catch {
      setError('Не удалось загрузить данетки')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPuzzles(page)
  }, [page, loadPuzzles])

  function goToPage(next: number) {
    if (next < 1 || next > totalPages || next === page) return
    setPage(next)
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Все данетки</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {total > 0
              ? `${total} загадок в базе · страница ${page} из ${totalPages}`
              : 'Каталог сгенерированных загадок'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => loadPuzzles(page)} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Обновить
        </Button>
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Загрузка...</p>}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!isLoading && !error && puzzles.length === 0 && (
        <Card>
          <p className="text-sm text-zinc-400">Данеток пока нет.</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {puzzles.map((puzzle) => (
          <PuzzleCard
            key={puzzle.puzzle_id}
            puzzle={puzzle}
            onOpen={() => navigate(`/puzzles/${puzzle.puzzle_id}`)}
          />
        ))}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            className="h-9 w-9 p-0"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || isLoading}
            aria-label="Предыдущая страница"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[8rem] text-center text-sm text-zinc-400">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            className="h-9 w-9 p-0"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages || isLoading}
            aria-label="Следующая страница"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
