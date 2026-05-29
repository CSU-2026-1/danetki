import { useEffect, useState } from 'react'
import { getPuzzles, type Puzzle } from '../api/services'
import { Card } from '../components/ui/Card'
import { formatUnixDate } from '../lib/utils'

export function PuzzlesList() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getPuzzles(1, 24)
        setPuzzles(data.puzzles)
        setTotal(data.total)
      } catch {
        setError('Не удалось загрузить данетки')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Данетки</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {total > 0 ? `${total} загадок в базе` : 'Каталог сгенерированных загадок'}
          </p>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-zinc-500">Загрузка...</p>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!isLoading && !error && puzzles.length === 0 && (
        <Card>
          <p className="text-sm text-zinc-400">Данеток пока нет. Запустите парсер и дождитесь генерации.</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {puzzles.map((puzzle) => (
          <Card key={puzzle.puzzle_id} className="flex flex-col justify-between">
            <p className="text-sm leading-relaxed text-zinc-200">{puzzle.open_part}</p>
            <p className="mt-4 text-xs text-zinc-500">
              {formatUnixDate(puzzle.created_at)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
