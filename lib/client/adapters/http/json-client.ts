export interface JsonClient {
  get<T>(url: string, init?: RequestInit): Promise<T>
  post<T>(url: string, body: unknown, init?: RequestInit): Promise<T>
  put<T>(url: string, body: unknown, init?: RequestInit): Promise<T>
  delete<T>(url: string, init?: RequestInit): Promise<T>
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof payload?.error === 'string'
      ? payload.error
      : typeof payload?.error?.message === 'string'
        ? payload.error.message
        : 'Request failed'
    const details = Array.isArray(payload?.error?.details) ? payload.error.details : []
    const detailText = details.length > 0 ? `: ${details.join(', ')}` : ''
    throw new Error(`${message}${detailText}`)
  }

  return payload as T
}

export function createFetchJsonClient(fetcher: typeof fetch = fetch): JsonClient {
  const jsonHeaders = { 'Content-Type': 'application/json' }

  return {
    get<T>(url: string, init?: RequestInit) {
      return fetcher(url, init).then(readJson<T>)
    },
    post<T>(url: string, body: unknown, init?: RequestInit) {
      return fetcher(url, {
        ...init,
        method: 'POST',
        headers: { ...jsonHeaders, ...init?.headers },
        body: JSON.stringify(body)
      }).then(readJson<T>)
    },
    put<T>(url: string, body: unknown, init?: RequestInit) {
      return fetcher(url, {
        ...init,
        method: 'PUT',
        headers: { ...jsonHeaders, ...init?.headers },
        body: JSON.stringify(body)
      }).then(readJson<T>)
    },
    delete<T>(url: string, init?: RequestInit) {
      return fetcher(url, { ...init, method: 'DELETE' }).then(readJson<T>)
    }
  }
}
