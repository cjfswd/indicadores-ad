import { describe, it, expect } from 'vitest'
import {
  CHART_COLORS,
  CHART_THEME,
  MESES_LABELS,
  statusLabel,
  statusColor,
} from '@/lib/chart-helpers'

describe('CHART_COLORS', () => {
  it('deve ter cores primárias definidas', () => {
    expect(CHART_COLORS.primary).toBe('#6366f1')
    expect(CHART_COLORS.secondary).toBe('#8b5cf6')
    expect(CHART_COLORS.accent).toBe('#06b6d4')
    expect(CHART_COLORS.success).toBe('#10b981')
    expect(CHART_COLORS.warning).toBe('#f59e0b')
    expect(CHART_COLORS.danger).toBe('#ef4444')
    expect(CHART_COLORS.muted).toBe('#64748b')
  })

  it('deve ter cores para operadoras', () => {
    expect(CHART_COLORS.operadoras.Camperj).toBeDefined()
    expect(CHART_COLORS.operadoras.Unimed).toBeDefined()
  })
})

describe('CHART_THEME', () => {
  it('deve ter configurações de fonte', () => {
    expect(CHART_THEME.fontSize).toBe(11)
    expect(CHART_THEME.fontFamily).toContain('Inter')
  })

  it('deve ter configurações de grid', () => {
    expect(CHART_THEME.grid.stroke).toBeDefined()
    expect(CHART_THEME.grid.strokeDasharray).toBe('3 3')
  })

  it('deve ter configurações de tooltip', () => {
    expect(CHART_THEME.tooltip.bg).toBeDefined()
    expect(CHART_THEME.tooltip.border).toBeDefined()
    expect(CHART_THEME.tooltip.text).toBeDefined()
  })
})

describe('MESES_LABELS', () => {
  it('deve ter 12 meses', () => {
    expect(MESES_LABELS).toHaveLength(12)
  })

  it('deve começar com Jan e terminar com Dez', () => {
    expect(MESES_LABELS[0]).toBe('Jan')
    expect(MESES_LABELS[11]).toBe('Dez')
  })
})

describe('statusLabel', () => {
  it('deve retornar label correto para cada status', () => {
    expect(statusLabel('verde')).toBe('Dentro da meta')
    expect(statusLabel('amarelo')).toBe('Atenção — próximo do limite')
    expect(statusLabel('vermelho')).toBe('Fora da meta')
  })

  it('deve retornar "Sem meta definida" para status desconhecido', () => {
    expect(statusLabel('desconhecido')).toBe('Sem meta definida')
    expect(statusLabel('')).toBe('Sem meta definida')
  })
})

describe('statusColor', () => {
  it('deve retornar cor correta para cada status', () => {
    expect(statusColor('verde')).toBe(CHART_COLORS.success)
    expect(statusColor('amarelo')).toBe(CHART_COLORS.warning)
    expect(statusColor('vermelho')).toBe(CHART_COLORS.danger)
  })

  it('deve retornar cor muted para status desconhecido', () => {
    expect(statusColor('desconhecido')).toBe(CHART_COLORS.muted)
  })
})
