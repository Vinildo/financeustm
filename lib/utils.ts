import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PagamentoParcial } from "@/types/fornecedor"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A"

  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "N/A"

  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function calculateDaysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function isOverdue(dueDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "pendente":
      return "bg-yellow-100 text-yellow-800"
    case "pago":
      return "bg-green-100 text-green-800"
    case "atrasado":
      return "bg-red-100 text-red-800"
    case "cancelado":
      return "bg-gray-100 text-gray-800"
    case "parcial":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-blue-100 text-blue-800"
  }
}

export function getRandomColor(): string {
  const colors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-purple-100",
    "bg-pink-100",
    "bg-indigo-100",
    "bg-red-100",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateYearMonthOptions(
  startYear: number = new Date().getFullYear() - 5,
  endYear: number = new Date().getFullYear() + 1,
): { value: string; label: string }[] {
  const options = []

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, "0")
      const value = `${year}-${monthStr}`
      const label = `${monthStr}/${year}`
      options.push({ value, label })
    }
  }

  return options.reverse() // Mais recentes primeiro
}

export function getMonthName(month: number): string {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  return monthNames[month - 1]
}

export function getQuarterFromMonth(month: number): number {
  return Math.ceil(month / 3)
}

export function getQuarterLabel(quarter: number): string {
  return `${quarter}º Trimestre`
}

export function getMonthsInQuarter(quarter: number): number[] {
  const startMonth = (quarter - 1) * 3 + 1
  return [startMonth, startMonth + 1, startMonth + 2]
}

export function getFinancialYearLabel(year: number): string {
  return `Ano Fiscal ${year}/${year + 1}`
}

export function getCurrentFinancialYear(): number {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  // Se estamos após julho, estamos no ano fiscal que começa neste ano
  // Caso contrário, estamos no ano fiscal que começou no ano anterior
  return currentMonth >= 7 ? currentYear : currentYear - 1
}

export function getFinancialYearRange(year: number): { start: Date; end: Date } {
  return {
    start: new Date(`${year}-07-01`),
    end: new Date(`${year + 1}-06-30`),
  }
}

export function isWithinFinancialYear(date: Date, year: number): boolean {
  const { start, end } = getFinancialYearRange(year)
  return date >= start && date <= end
}

export function getFinancialYearProgress(year: number): number {
  const { start, end } = getFinancialYearRange(year)
  const today = new Date()

  if (today < start) return 0
  if (today > end) return 100

  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const daysPassed = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

  return Math.round((daysPassed / totalDays) * 100)
}

export function generateFinancialYearOptions(
  startYear: number = getCurrentFinancialYear() - 5,
  endYear: number = getCurrentFinancialYear(),
): { value: number; label: string }[] {
  const options = []

  for (let year = startYear; year <= endYear; year++) {
    options.push({
      value: year,
      label: getFinancialYearLabel(year),
    })
  }

  return options.reverse() // Mais recentes primeiro
}

// Funções para lidar com pagamentos parciais
export function calcularValorPendente(valorOriginal: number, pagamentosParciais?: PagamentoParcial[]): number {
  if (!pagamentosParciais || pagamentosParciais.length === 0) return valorOriginal

  const totalPago = pagamentosParciais.reduce((total, pagamento) => total + pagamento.valor, 0)
  return Math.max(0, valorOriginal - totalPago)
}

export function getStatusPagamento(estado: string, valorOriginal: number, valorPendente: number): string {
  if (estado === "cancelado") return "cancelado"
  if (valorPendente <= 0) return "pago"
  if (valorPendente < valorOriginal) return "parcialmente pago"
  return estado
}

export function calcularPercentualPago(valorOriginal: number, valorPendente: number): number {
  if (valorOriginal <= 0) return 0
  const valorPago = valorOriginal - valorPendente
  const percentualPago = (valorPago / valorOriginal) * 100
  return Math.round(Math.max(0, Math.min(100, percentualPago)))
}

