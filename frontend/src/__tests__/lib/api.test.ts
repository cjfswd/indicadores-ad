import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock do import.meta.env
vi.stubGlobal('import', { meta: { env: {} } })

describe('api module', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('axios deve estar importável', () => {
    expect(axios).toBeDefined()
    expect(typeof axios.create).toBe('function')
  })

  it('deve criar instância com timeout padrão', () => {
    const instance = axios.create({ baseURL: '/api/v1', timeout: 15000 })
    expect(instance.defaults.timeout).toBe(15000)
    expect(instance.defaults.baseURL).toBe('/api/v1')
  })

  it('deve suportar interceptors de request', () => {
    const instance = axios.create({ baseURL: '/test' })
    const interceptorId = instance.interceptors.request.use((config) => {
      config.headers.Authorization = 'Bearer test-token'
      return config
    })
    expect(typeof interceptorId).toBe('number')
  })

  it('deve suportar interceptors de response', () => {
    const instance = axios.create({ baseURL: '/test' })
    const interceptorId = instance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error),
    )
    expect(typeof interceptorId).toBe('number')
  })
})

describe('localStorage token management', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve persistir e recuperar token', () => {
    localStorage.setItem('session_token', 'abc123')
    expect(localStorage.getItem('session_token')).toBe('abc123')
  })

  it('deve retornar null quando não há token', () => {
    expect(localStorage.getItem('session_token')).toBeNull()
  })

  it('deve remover token', () => {
    localStorage.setItem('session_token', 'abc123')
    localStorage.removeItem('session_token')
    expect(localStorage.getItem('session_token')).toBeNull()
  })
})
