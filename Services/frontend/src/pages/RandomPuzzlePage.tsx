import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPuzzleById, getPuzzleHidden, getRandomPuzzle, type Puzzle } from '../api/services'
import { Button } from '../components/ui/Button'
import { cn, formatUnixDate } from '../lib/utils'

export function RandomPuzzlePage() {
  const { id } = useParams<{ id: string }>()
  const isDetailView = Boolean(id)

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [hiddenPart, setHiddenPart] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)

  const resetViewState = useCallback(() => {
    setPuzzle(null)
    setHiddenPart(null)
    setRevealed(false)
    setError(null)
    setAnswerError(null)
  }, [])

  const loadPuzzleById = useCallback(
    async (puzzleId: string) => {
      setIsLoading(true)
      resetViewState()

      try {
        const loaded = await getPuzzleById(puzzleId)
        setPuzzle(loaded)
      } catch {
        setError('Не удалось загрузить данетку')
      } finally {
        setIsLoading(false)
      }
    },
    [resetViewState],
  )

  useEffect(() => {
    if (id) {
      void loadPuzzleById(id)
    }
  }, [id, loadPuzzleById])

  async function handleGenerate() {
    setIsLoading(true)
    resetViewState()

    try {
      const next = await getRandomPuzzle()
      setPuzzle(next)
    } catch {
      setError('Не удалось получить данетку')
    } finally {
      setIsLoading(false)
    }
  }

  async function toggleAnswer() {
    if (!puzzle) return

    if (revealed) {
      setRevealed(false)
      return
    }

    if (hiddenPart) {
      setRevealed(true)
      return
    }

    setIsLoadingAnswer(true)
    setAnswerError(null)

    try {
      const data = await getPuzzleHidden(puzzle.puzzle_id)
      setHiddenPart(data.hidden_part)
      setRevealed(true)
    } catch {
      setAnswerError('Ответ пока недоступен')
    } finally {
      setIsLoadingAnswer(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {isDetailView ? 'Просмотр данетки' : 'Генератор данеток'}
      </h1>

      {!puzzle && !error && !isDetailView && (
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
          Нажмите кнопку ниже, чтобы получить случайную загадку из коллекции.
        </p>
      )}

      {isDetailView && isLoading && !puzzle && (
        <p className="mt-4 text-sm text-zinc-500">Загрузка...</p>
      )}

      <div className={cn('mt-10 w-full transition-all duration-500', puzzle && 'mt-8')}>
        {puzzle && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-zinc-900/70 p-8 text-left shadow-2xl shadow-indigo-950/40 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {isDetailView ? 'Данетка' : 'Ваша данетка'}
            </p>

            <p className="mt-4 text-lg leading-relaxed text-zinc-100">{puzzle.open_part}</p>

            {revealed && hiddenPart && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="text-base leading-relaxed text-amber-100/90">{hiddenPart}</p>
              </div>
            )}

            {answerError && <p className="mt-3 text-sm text-red-400">{answerError}</p>}

            {puzzle.source_url && (
              <a
                href={puzzle.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-xs text-indigo-400 hover:text-indigo-300"
              >
                Источник
              </a>
            )}

            <p className="mt-3 text-xs text-zinc-500">{formatUnixDate(puzzle.created_at)}</p>

            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                onClick={toggleAnswer}
                disabled={isLoadingAnswer}
                className="rounded-full px-5"
              >
                {isLoadingAnswer ? (
                  'Загрузка...'
                ) : revealed ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Скрыть ответ
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Показать ответ
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mb-6 text-sm text-red-400">{error}</p>}

        {isDetailView ? (
          <div className="flex justify-center">
            <Link to="/puzzles">
              <Button variant="secondary">Назад ко всем данеткам</Button>
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              isLoading={isLoading}
              className={cn(
                'h-14 min-w-[220px] rounded-full px-8 text-base font-medium shadow-lg shadow-indigo-900/40',
                'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-800/50',
                !puzzle && 'h-16 min-w-[260px] text-lg',
              )}
            >
              {!isLoading && <Sparkles className="h-5 w-5" />}
              {puzzle ? 'Ещё одна' : 'Сгенерировать'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
