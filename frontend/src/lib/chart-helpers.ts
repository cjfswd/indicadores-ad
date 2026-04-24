// Paleta de cores para gráficos — compatível com temas claro/escuro
export const CHART_COLORS = {
  primary: '#6366f1',    // indigo
  secondary: '#8b5cf6',  // violet
  accent: '#06b6d4',     // cyan
  success: '#10b981',    // emerald
  warning: '#f59e0b',    // amber
  danger: '#ef4444',     // red
  muted: '#64748b',      // slate
  operadoras: {
    Camperj: '#6366f1',
    Unimed: '#06b6d4',
  } as Record<string, string>,
} as const

export const CHART_THEME = {
  fontSize: 11,
  fontFamily: 'Inter, system-ui, sans-serif',
  grid: { stroke: 'rgba(148, 163, 184, 0.1)', strokeDasharray: '3 3' },
  axis: { stroke: 'rgba(148, 163, 184, 0.3)', fontSize: 10, fill: '#94a3b8' },
  tooltip: {
    bg: 'var(--color-surface-1)',
    border: 'var(--color-border)',
    text: 'var(--color-text-primary)',
  },
} as const

export const MESES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

export function statusLabel(status: string): string {
  switch (status) {
    case 'verde': return 'Dentro da meta'
    case 'amarelo': return 'Atenção — próximo do limite'
    case 'vermelho': return 'Fora da meta'
    default: return 'Sem meta definida'
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'verde': return CHART_COLORS.success
    case 'amarelo': return CHART_COLORS.warning
    case 'vermelho': return CHART_COLORS.danger
    default: return CHART_COLORS.muted
  }
}
