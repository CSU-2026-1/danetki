const STORAGE_KEY = 'danetka_parser_job_ids'
const MAX_JOBS = 30

export function loadParserJobIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
  } catch {
    return []
  }
}

export function rememberParserJobId(jobId: string): string[] {
  const ids = [jobId, ...loadParserJobIds().filter((id) => id !== jobId)].slice(0, MAX_JOBS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  return ids
}

export function removeParserJobId(jobId: string): string[] {
  const ids = loadParserJobIds().filter((id) => id !== jobId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  return ids
}
