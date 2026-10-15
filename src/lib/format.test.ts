import { describe, expect, it } from "vitest"
import {
  daysFromTodayAt,
  followUpState,
  formatCurrency,
  formatDayShort,
  formatLongDay,
  formatPhone,
  formatRelativeDate,
  formatTime,
  isoToMxParts,
  mxDateTimeToIso,
  rangeBounds,
  telUrl,
  whatsappUrl,
} from "@/lib/format"

describe("fechas en Ciudad de México", () => {
  it("muestra la hora en America/Mexico_City", () => {
    expect(formatTime("2026-10-20T16:00:00Z")).toBe("10:00")
    expect(formatTime("2026-10-15T21:52:23.296614Z")).toBe("15:52")
  })

  it("usa el día de Ciudad de México aunque en UTC ya sea otro día", () => {
    expect(formatDayShort("2026-10-16T03:30:00Z")).toBe("jue 15")
    expect(formatLongDay("2026-10-16T03:30:00Z")).toBe("jueves 15 de octubre")
  })

  it("convierte fecha y hora local de Ciudad de México a ISO con zona", () => {
    expect(mxDateTimeToIso("2026-10-20", "10:00")).toBe("2026-10-20T10:00:00-06:00")
    expect(isoToMxParts("2026-10-20T16:00:00Z")).toEqual({ date: "2026-10-20", time: "10:00" })
  })

  it("calcula presets de seguimiento a una hora fija", () => {
    const now = new Date("2026-10-15T21:00:00Z")
    expect(daysFromTodayAt(1, "10:00", now)).toBe("2026-10-16T10:00:00-06:00")
    expect(daysFromTodayAt(7, "10:00", now)).toBe("2026-10-22T10:00:00-06:00")
  })

  it("clasifica seguimientos contra el inicio del día en Ciudad de México", () => {
    const now = new Date("2026-10-15T18:00:00Z")
    expect(followUpState("2026-10-15T05:59:00Z", now)).toBe("overdue")
    expect(followUpState("2026-10-15T06:00:00Z", now)).toBe("today")
    expect(followUpState("2026-10-16T05:59:00Z", now)).toBe("today")
    expect(followUpState("2026-10-16T06:00:00Z", now)).toBe("upcoming")
  })

  it("formatea fechas relativas en español", () => {
    const now = new Date("2026-10-15T18:00:00Z")
    expect(formatRelativeDate("2026-10-16T16:00:00Z", now)).toBe("mañana a las 10:00")
    expect(formatRelativeDate("2026-10-15T16:00:00Z", now)).toBe("hoy a las 10:00")
    expect(formatRelativeDate("2026-10-13T16:00:00Z", now)).toBe("hace 2 días")
  })

  it("calcula rangos de actividad en Ciudad de México", () => {
    const now = new Date("2026-10-15T18:00:00Z")
    expect(rangeBounds("today", {}, now)).toEqual({
      from: "2026-10-15T00:00:00.000-06:00",
      to: "2026-10-15T23:59:59.999-06:00",
    })
    expect(rangeBounds("week", {}, now).from).toBe("2026-10-12T00:00:00.000-06:00")
    expect(rangeBounds("month", {}, now).to).toBe("2026-10-31T23:59:59.999-06:00")
    expect(rangeBounds("custom", { from: "2026-10-01", to: "2026-10-03" }, now)).toEqual({
      from: "2026-10-01T00:00:00.000-06:00",
      to: "2026-10-03T23:59:59.999-06:00",
    })
  })
})

describe("teléfonos", () => {
  it("formatea números de 10 dígitos", () => {
    expect(formatPhone("5512345678")).toBe("55 1234 5678")
    expect(formatPhone("+52 (55) 1234-5678")).toBe("525512345678")
    expect(formatPhone(null)).toBe("")
  })

  it("arma el enlace de WhatsApp", () => {
    expect(whatsappUrl("5512345678")).toBe("https://wa.me/525512345678")
    expect(whatsappUrl("525512345678")).toBe("https://wa.me/525512345678")
    expect(whatsappUrl("")).toBeNull()
  })

  it("arma el enlace para llamar", () => {
    expect(telUrl("5512345678")).toBe("tel:+525512345678")
    expect(telUrl("13055551234")).toBe("tel:+13055551234")
    expect(telUrl(null)).toBeNull()
  })
})

describe("moneda", () => {
  it("formatea montos en MXN", () => {
    expect(formatCurrency("15000.50")).toBe("$15,000.50")
    expect(formatCurrency("0")).toBe("$0.00")
    expect(formatCurrency(null)).toBe("")
  })
})
