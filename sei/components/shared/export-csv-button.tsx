'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadCsv, type CsvCell } from '@/lib/csv'

export function ExportCsvButton({
  filename,
  headers,
  rows,
  disabled,
  label = 'Export CSV',
}: {
  filename: string
  headers: string[]
  rows: CsvCell[][]
  disabled?: boolean
  label?: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || rows.length === 0}
      onClick={() => downloadCsv(filename, headers, rows)}
    >
      <Download data-icon="inline-start" aria-hidden="true" />
      {label}
    </Button>
  )
}
