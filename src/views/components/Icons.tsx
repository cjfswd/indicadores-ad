import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import {
  Pencil as _Pencil, Trash2 as _Trash2, Pause as _Pause, Play as _Play,
  Plus as _Plus, X as _X, Undo2 as _Undo2, Check as _Check,
  Download as _Download, FileSpreadsheet as _FileSpreadsheet,
  Paperclip as _Paperclip, Calendar as _Calendar, CalendarRange as _CalendarRange,
  Search as _Search, ExternalLink as _ExternalLink,
  Users as _Users, AlertTriangle as _AlertTriangle, TrendingUp as _TrendingUp,
  UserX as _UserX, Activity as _Activity, Target as _Target, History as _History,
  LayoutDashboard as _LayoutDashboard, ClipboardList as _ClipboardList,
  Sun as _Sun, Moon as _Moon, Loader2 as _Loader2, Info as _Info,
  ChevronLeft as _ChevronLeft, ChevronRight as _ChevronRight,
} from 'lucide-static'

interface IconProps {
  size?: number
  class?: string
}

/** Wraps a lucide-static SVG string into a Hono JSX FC with size/class props */
function icon(svg: string): FC<IconProps> {
  return ({ size = 20, class: cls }) => {
    let s = svg
      .replace(/width="\d+"/, `width="${size}"`)
      .replace(/height="\d+"/, `height="${size}"`)
    if (cls) s = s.replace(/class="([^"]*)"/, `class="$1 ${cls}"`)
    return raw(s)
  }
}

/* ─── Navigation ─── */
export const LayoutDashboard = icon(_LayoutDashboard)
export const ClipboardList = icon(_ClipboardList)
export const Users = icon(_Users)
export const Target = icon(_Target)
export const History = icon(_History)
export const Activity = icon(_Activity)

/* ─── Actions ─── */
export const Pencil = icon(_Pencil)
export const Trash2 = icon(_Trash2)
export const Pause = icon(_Pause)
export const Play = icon(_Play)
export const Plus = icon(_Plus)
export const X = icon(_X)
export const Undo2 = icon(_Undo2)
export const Check = icon(_Check)

/* ─── Data / Content ─── */
export const Download = icon(_Download)
export const FileSpreadsheet = icon(_FileSpreadsheet)
export const Paperclip = icon(_Paperclip)
export const Calendar = icon(_Calendar)
export const CalendarRange = icon(_CalendarRange)
export const Search = icon(_Search)
export const ExternalLink = icon(_ExternalLink)
export const AlertTriangle = icon(_AlertTriangle)
export const TrendingUp = icon(_TrendingUp)
export const UserX = icon(_UserX)
export const Info = icon(_Info)

/* ─── UI Chrome ─── */
export const Sun = icon(_Sun)
export const Moon = icon(_Moon)
export const Loader2 = icon(_Loader2)
export const ChevronLeft = icon(_ChevronLeft)
export const ChevronRight = icon(_ChevronRight)
