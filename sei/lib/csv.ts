/**
 * Minimal client-side CSV export. Cells are quoted/escaped per RFC 4180 and
 * values starting with =, +, - or @ are prefixed with an apostrophe to avoid
 * spreadsheet formula injection.
 */
export type CsvCell = string | number | boolean | null | undefined

function escapeCell(value: CsvCell) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  if (typeof value === 'string' && /^[=+\-@]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers: string[], rows: CsvCell[][]) {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]) {
  const blob = new Blob([`﻿${toCsv(headers, rows)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
