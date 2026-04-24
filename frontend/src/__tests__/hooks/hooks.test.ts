import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import axios from 'axios'
import { useApi, useMutate } from '@/lib/hooks'

// Mock do módulo api
vi.mock('@/lib/api', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
  return { api: mockApi }
})

// Import after mock
const { api } = await import('@/lib/api')
const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve iniciar com loading=true por padrão', () => {
    mockedApi.get.mockImplementation(() => new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useApi('/test'))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('deve retornar dados após fetch bem-sucedido', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [1, 2, 3] } })
    const { result } = renderHook(() => useApi('/test'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ items: [1, 2, 3] })
    expect(result.current.error).toBeNull()
  })

  it('deve retornar erro em caso de falha', async () => {
    mockedApi.get.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useApi('/test'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.data).toBeNull()
  })

  it('NÃO deve buscar quando immediate=false', () => {
    const { result } = renderHook(() => useApi('/test', { immediate: false }))
    expect(result.current.loading).toBe(false)
    expect(mockedApi.get).not.toHaveBeenCalled()
  })

  it('deve usar initialData', () => {
    mockedApi.get.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useApi('/test', { initialData: 'default' }))
    expect(result.current.data).toBe('default')
  })

  it('deve suportar refetch', async () => {
    let callCount = 0
    mockedApi.get.mockImplementation(async () => {
      callCount++
      return { data: `response-${callCount}` }
    })

    const { result } = renderHook(() => useApi('/test'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe('response-1')

    await act(async () => {
      await result.current.refetch()
    })
    expect(result.current.data).toBe('response-2')
  })
})

describe('useMutate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve executar POST', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: '1', nome: 'Teste' } })
    const { result } = renderHook(() => useMutate('post'))

    let response: unknown
    await act(async () => {
      response = await result.current.mutate('/test', { nome: 'Teste' })
    })

    expect(response).toEqual({ id: '1', nome: 'Teste' })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('deve executar DELETE sem body', async () => {
    mockedApi.delete.mockResolvedValue({ data: null })
    const { result } = renderHook(() => useMutate('delete'))

    await act(async () => {
      await result.current.mutate('/test/1')
    })

    expect(mockedApi.delete).toHaveBeenCalledWith('/test/1')
  })

  it('deve capturar erro na mutação', async () => {
    mockedApi.put.mockRejectedValue(new Error('Validation failed'))
    const { result } = renderHook(() => useMutate('put'))

    let response: unknown
    await act(async () => {
      response = await result.current.mutate('/test/1', { nome: '' })
    })

    expect(response).toBeNull()
    expect(result.current.error).toBe('Validation failed')
  })

  it('deve mostrar loading durante mutação', async () => {
    let resolvePromise: (value: unknown) => void
    mockedApi.post.mockImplementation(() => new Promise((resolve) => { resolvePromise = resolve }))

    const { result } = renderHook(() => useMutate('post'))
    expect(result.current.loading).toBe(false)

    act(() => {
      result.current.mutate('/test', {})
    })

    // Loading deveria estar true após iniciar
    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolvePromise!({ data: {} })
    })

    expect(result.current.loading).toBe(false)
  })
})
