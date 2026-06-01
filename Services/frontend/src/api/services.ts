import axios from 'axios'
import { apiClient } from './client'

export type AuthResponse = {
  user_id: string
  token: string
  expires_at: number
}

export type Puzzle = {
  puzzle_id: string
  open_part: string
  source_url: string
  created_at: number
}

export type PuzzlesResponse = {
  puzzles: Puzzle[]
  total: number
  page: number
}

export type PuzzleHiddenResponse = {
  hidden_part: string
}

export type StartParserResponse = {
  job_id: string
  message: string
}

export type ParserStatusResponse = {
  job_id: string
  status: string
  total_found: number
  total_queued: number
  total_skipped: number
  error: string
  started_at: number
  finished_at: number
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export async function register(
  email: string,
  password: string,
  username: string,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
    username,
  })
  return data
}

type PuzzlesApiPayload = {
  puzzles?: Puzzle[]
  Puzzles?: Puzzle[]
  total?: number
  Total?: number
  page?: number
  Page?: number
}

function normalizePuzzle(raw: Record<string, unknown>): Puzzle {
  return {
    puzzle_id: String(raw.puzzle_id ?? raw.PuzzleId ?? raw.puzzleId ?? ''),
    open_part: String(raw.open_part ?? raw.OpenPart ?? raw.openPart ?? ''),
    source_url: String(raw.source_url ?? raw.SourceUrl ?? raw.sourceUrl ?? ''),
    created_at: Number(raw.created_at ?? raw.CreatedAt ?? raw.createdAt ?? 0),
  }
}

export async function getAllPuzzles(
  page = 1,
  pageSize = 10,
): Promise<PuzzlesResponse> {
  const { data } = await apiClient.get<PuzzlesApiPayload>('/puzzle/all', {
    params: { page, page_size: pageSize },
  })

  const rawPuzzles = (data.puzzles ?? data.Puzzles ?? []) as Record<string, unknown>[]

  return {
    puzzles: rawPuzzles.map((item) => normalizePuzzle(item)),
    total: data.total ?? data.Total ?? 0,
    page: data.page ?? data.Page ?? page,
  }
}

export async function getRandomPuzzle(): Promise<Puzzle> {
  const { data } = await apiClient.get<Puzzle>('/puzzle/random')
  return data
}

export async function getPuzzleHidden(id: string): Promise<PuzzleHiddenResponse> {
  const { data } = await apiClient.get<PuzzleHiddenResponse>(`/puzzle/hidden/${id}`)
  return data
}

type ParserStatusPayload = Record<string, unknown>

const STATUS_BY_NUMBER = [
  'STATUS_UNKNOWN',
  'STATUS_RUNNING',
  'STATUS_DONE',
  'STATUS_FAILED',
] as const

function normalizeParserStatus(raw: ParserStatusPayload): ParserStatusResponse {
  const statusRaw = raw.status ?? raw.Status
  let status: string
  if (typeof statusRaw === 'number') {
    status = STATUS_BY_NUMBER[statusRaw] ?? 'STATUS_UNKNOWN'
  } else {
    status = String(statusRaw ?? 'STATUS_UNKNOWN')
  }

  return {
    job_id: String(raw.job_id ?? raw.JobId ?? raw.jobId ?? ''),
    status,
    total_found: Number(raw.total_found ?? raw.TotalFound ?? raw.totalFound ?? 0),
    total_queued: Number(raw.total_queued ?? raw.TotalQueued ?? raw.totalQueued ?? 0),
    total_skipped: Number(raw.total_skipped ?? raw.TotalSkipped ?? raw.totalSkipped ?? 0),
    error: String(raw.error ?? raw.Error ?? ''),
    started_at: Number(raw.started_at ?? raw.StartedAt ?? raw.startedAt ?? 0),
    finished_at: Number(raw.finished_at ?? raw.FinishedAt ?? raw.finishedAt ?? 0),
  }
}

export async function startParser(
  limit: number,
  sourceUrl: string,
): Promise<StartParserResponse> {
  const { data } = await apiClient.post<Record<string, unknown>>('/parser/start', {
    limit,
    source_url: sourceUrl,
  })
  return {
    job_id: String(data.job_id ?? data.JobId ?? data.jobId ?? ''),
    message: String(data.message ?? data.Message ?? ''),
  }
}

export async function getParserStatus(jobId?: string): Promise<ParserStatusResponse | null> {
  try {
    const { data } = await apiClient.get<ParserStatusPayload>('/parser/status', {
      params: jobId ? { job_id: jobId } : undefined,
    })
    return normalizeParserStatus(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}
