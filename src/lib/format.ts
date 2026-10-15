import { TZDate, tz } from "@date-fns/tz"
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  formatDistanceStrict,
  formatISO,
  formatRelative,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"

export const TIME_ZONE = "America/Mexico_City"

const inMx = tz(TIME_ZONE)

type DateInput = string | Date

function toDate(value: DateInput): Date {
  return typeof value === "string" ? new Date(value) : value
}

export function formatTime(value: DateInput): string {
  return format(toDate(value), "HH:mm", { in: inMx })
}

export function formatDayShort(value: DateInput): string {
  return format(toDate(value), "EEE d", { in: inMx, locale: es })
}

export function formatLongDay(value: DateInput): string {
  return format(toDate(value), "EEEE d 'de' MMMM", { in: inMx, locale: es })
}

export function formatDate(value: DateInput): string {
  return format(toDate(value), "d 'de' MMMM 'de' yyyy", { in: inMx, locale: es })
}

export function formatShortDate(value: DateInput): string {
  return format(toDate(value), "d MMM yyyy", { in: inMx, locale: es })
}

export function formatDateTime(value: DateInput): string {
  return format(toDate(value), "EEEE d 'de' MMMM 'de' yyyy, HH:mm", { in: inMx, locale: es })
}

export function formatRelativeDate(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value)
  const days = differenceInCalendarDays(date, now, { in: inMx })
  if (days >= -1 && days <= 6) {
    return formatRelative(date, now, { in: inMx, locale: es })
  }
  if (days < -1 && days > -30) {
    return `hace ${-days} días`
  }
  if (days <= -30) {
    return formatDistanceStrict(date, now, { addSuffix: true, locale: es, roundingMethod: "floor" })
  }
  const sameYear = format(date, "yyyy", { in: inMx }) === format(now, "yyyy", { in: inMx })
  return format(date, sameYear ? "EEE d 'de' MMM, HH:mm" : "d 'de' MMM 'de' yyyy", { in: inMx, locale: es })
}

export type FollowUpState = "overdue" | "today" | "upcoming"

export function followUpState(value: DateInput, now: Date = new Date()): FollowUpState {
  const date = toDate(value)
  const today = startOfDay(now, { in: inMx })
  if (date < today) return "overdue"
  if (date < addDays(today, 1)) return "today"
  return "upcoming"
}

export function mxDateTimeToIso(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  return formatISO(new TZDate(year, month - 1, day, hours, minutes, TIME_ZONE))
}

export function isoToMxParts(value: string): { date: string; time: string } {
  const date = toDate(value)
  return {
    date: format(date, "yyyy-MM-dd", { in: inMx }),
    time: format(date, "HH:mm", { in: inMx }),
  }
}

export function todayMx(now: Date = new Date()): string {
  return format(now, "yyyy-MM-dd", { in: inMx })
}

export function daysFromTodayAt(days: number, time: string, now: Date = new Date()): string {
  const date = format(addDays(startOfDay(now, { in: inMx }), days), "yyyy-MM-dd", { in: inMx })
  return mxDateTimeToIso(date, time)
}

export function dateStringToLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function localDateToDateString(value: Date): string {
  return format(value, "yyyy-MM-dd")
}

export type RangePreset = "today" | "week" | "month" | "custom"

export function rangeBounds(
  preset: RangePreset,
  custom: { from?: string; to?: string } = {},
  now: Date = new Date(),
): { from?: string; to?: string } {
  const current = new TZDate(now, TIME_ZONE)
  if (preset === "today") {
    return { from: startOfDay(current).toISOString(), to: endOfDay(current).toISOString() }
  }
  if (preset === "week") {
    return {
      from: startOfWeek(current, { weekStartsOn: 1 }).toISOString(),
      to: endOfWeek(current, { weekStartsOn: 1 }).toISOString(),
    }
  }
  if (preset === "month") {
    return { from: startOfMonth(current).toISOString(), to: endOfMonth(current).toISOString() }
  }
  return {
    from: custom.from ? startOfDay(mxDay(custom.from)).toISOString() : undefined,
    to: custom.to ? endOfDay(mxDay(custom.to)).toISOString() : undefined,
  }
}

function mxDay(value: string): TZDate {
  const [year, month, day] = value.split("-").map(Number)
  return new TZDate(year, month - 1, day, TIME_ZONE)
}

const currencyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" })

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return ""
  const amount = typeof value === "number" ? value : Number(value)
  return Number.isFinite(amount) ? currencyFormatter.format(amount) : ""
}

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "")
}

export function formatPhone(value: string | null | undefined): string {
  const digits = digitsOnly(value)
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
  }
  return digits
}

export function whatsappUrl(value: string | null | undefined): string | null {
  const digits = digitsOnly(value)
  if (!digits) return null
  return `https://wa.me/${digits.length === 10 ? `52${digits}` : digits}`
}

export function telUrl(value: string | null | undefined): string | null {
  const digits = digitsOnly(value)
  if (!digits) return null
  return `tel:+${digits.length === 10 ? `52${digits}` : digits}`
}

export function websiteUrl(value: string | null | undefined): string | null {
  const text = value?.trim()
  if (!text) return null
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

export function socialUrl(value: string | null | undefined, network: "instagram" | "facebook"): string | null {
  const text = value?.trim()
  if (!text) return null
  if (/^https?:\/\//i.test(text)) return text
  if (/^(www\.)?(instagram|facebook)\.com\//i.test(text)) return `https://${text}`
  return `https://${network}.com/${text.replace(/^@/, "")}`
}

export function fullName(user: { name: string; second_name: string | null }): string {
  return [user.name, user.second_name].filter(Boolean).join(" ")
}
