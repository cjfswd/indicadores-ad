import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

interface UseApiOptions<T> {
  initialData?: T
  immediate?: boolean
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useApi<T>(url: string, opts: UseApiOptions<T> = {}): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(opts.initialData ?? null)
  const [loading, setLoading] = useState(opts.immediate !== false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<T>(url)
      setData(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (opts.immediate !== false) {
      fetch()
    }
  }, [fetch, opts.immediate])

  return { data, loading, error, refetch: fetch }
}

export function useMutate<TBody, TResponse = unknown>(method: 'post' | 'put' | 'patch' | 'delete') {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (url: string, body?: TBody): Promise<TResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = method === 'delete'
        ? await api.delete<TResponse>(url)
        : await api[method]<TResponse>(url, body)
      return res.data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [method])

  return { mutate, loading, error }
}
