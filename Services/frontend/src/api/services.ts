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

export async function getAllPuzzles(
  page = 1,
  pageSize = 10,
): Promise<PuzzlesResponse> {
  const { data } = await apiClient.get<PuzzlesResponse>('/puzzle/all', {
    params: { page, page_size: pageSize },
  })
  return data
}

export async function getRandomPuzzle(): Promise<Puzzle> {
  const { data } = await apiClient.get<Puzzle>('/puzzle/random')
  return data
}

export async function getPuzzleHidden(id: string): Promise<PuzzleHiddenResponse> {
  const { data } = await apiClient.get<PuzzleHiddenResponse>(`/puzzle/hidden/${id}`)
  return data
}

export async function startParser(
  limit: number,
  sourceUrl: string,
): Promise<StartParserResponse> {
  const { data } = await apiClient.post<StartParserResponse>('/parser/start', {
    limit,
    source_url: sourceUrl,
  })
  return data
}

export async function getParserStatus(jobId?: string): Promise<ParserStatusResponse> {
  const { data } = await apiClient.get<ParserStatusResponse>('/parser/status', {
    params: jobId ? { job_id: jobId } : undefined,
  })
  return data
}
