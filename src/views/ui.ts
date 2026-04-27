/** Shared Tailwind v4 utility class constants — single source of truth for all TSX components */

/* ─── Layout ─── */
export const PAGE = 'flex flex-col gap-4 sm:gap-6'

/* ─── Glass Card ─── */
export const CARD = 'bg-[image:var(--glass-bg)] backdrop-blur-[12px] border border-(--color-border) rounded-xl shadow-(--shadow-card) transition-all duration-200 p-3 sm:p-5'
export const CARD_SM = 'bg-[image:var(--glass-bg)] backdrop-blur-[12px] border border-(--color-border) rounded-xl shadow-(--shadow-card) transition-all duration-200 p-3'

/* ─── Form Controls ─── */
export const INPUT = 'bg-(--color-surface-0) border border-(--color-border) rounded-lg py-2 px-3 text-sm text-(--color-text-primary) font-[inherit] transition-all duration-150 w-full focus:outline-none focus:border-(--color-accent) focus:ring-3 focus:ring-(--color-accent)/15'
export const SELECT = 'bg-(--color-surface-0) border border-(--color-border) rounded-lg py-2 px-3 text-sm text-(--color-text-primary) font-[inherit] transition-all duration-150 w-auto focus:outline-none focus:border-(--color-accent) focus:ring-3 focus:ring-(--color-accent)/15'
export const TEXTAREA = `${INPUT} resize-y min-h-20`

/* ─── Buttons ─── */
export const BTN = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border border-transparent transition-all duration-150 whitespace-nowrap'
export const BTN_SM = 'inline-flex items-center gap-2 py-1.5 px-3 rounded-lg text-[.8125rem] font-medium cursor-pointer border border-transparent transition-all duration-150 whitespace-nowrap'
export const BTN_ICON = 'inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm cursor-pointer border border-transparent transition-all duration-150 bg-transparent hover:bg-(--color-surface-2)'

/* ─── Button Variants ─── */
export const BTN_PRIMARY = `${BTN} bg-(--color-accent) text-white hover:bg-(--color-accent-hover)`
export const BTN_SECONDARY = `${BTN} bg-(--color-surface-2) text-(--color-text-primary) border-(--color-border)`
export const BTN_DANGER = `${BTN} bg-red-600 text-white hover:bg-red-500`
export const BTN_GHOST = `${BTN} !px-2 bg-transparent text-(--color-text-secondary) hover:text-(--color-text-primary)`

/* ─── Badges ─── */
export const BADGE = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-(--color-surface-2) text-(--color-text-muted)'

/* ─── Modals ─── */
export const BACKDROP = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-100 animate-[fade-in_.15s_ease]'
export const MODAL = 'bg-(--color-surface-1) border border-(--color-border) rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,.5)] w-[min(95vw,560px)] max-h-[90vh] overflow-y-auto p-6 animate-[scale-in_.2s_ease]'
export const MODAL_HEADER = 'flex items-center justify-between mb-5 pb-4 border-b border-(--color-border)'
export const MODAL_FOOTER = 'flex justify-end gap-3 mt-5 pt-4 border-t border-(--color-border)'

/* ─── Form Fields ─── */
export const LABEL = 'text-[.8125rem] font-medium text-(--color-text-secondary)'
export const FIELD = 'flex flex-col gap-1.5'
