'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { DemoOnlyBadge } from '@/components/shared/simulated-badge'
import { AlertStatusBadge, SeverityBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { energyService } from '@/lib/api/energy-service'
import { hasPermission } from '@/lib/auth/roles'
import { formatDateTime, formatNumber, METER_TYPE_LABELS, STATUS_LABELS } from '@/lib/format'
import type { Alert, AlertStatus } from '@/lib/types'
import { AnomalyTypeLabel, OriginBadge } from './alerts-table'

const STATUS_ACTIONS: AlertStatus[] = ['investigating', 'resolved', 'dismissed', 'open']

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  )
}

export function AlertDetailsSheet({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  const { session } = useAuth()
  const { mutate } = useSWRConfig()
  const [current, setCurrent] = useState<Alert | null>(alert)
  const [pending, setPending] = useState<AlertStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (alert && alert.alert_id !== current?.alert_id) {
    setCurrent(alert)
    setError(null)
  }

  const shown = alert ? (current?.alert_id === alert.alert_id ? current : alert) : current
  const canUpdate = session ? hasPermission(session.role, 'anomalies.update') : false

  async function updateStatus(status: AlertStatus) {
    if (!shown) return
    setPending(status)
    setError(null)
    try {
      const updated = await energyService.updateAlertStatus(shown.alert_id, status)
      setCurrent(updated)
      await mutate((key) => Array.isArray(key) && (key[0] === 'alerts' || key[0] === 'dashboard'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the alert status.')
    } finally {
      setPending(null)
    }
  }

  const deviation =
    shown && shown.expected_value !== 0
      ? ((shown.observed_value - shown.expected_value) / shown.expected_value) * 100
      : 0

  return (
    <Sheet open={alert !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {shown && (
          <>
            <SheetHeader className="border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={shown.severity} />
                <AlertStatusBadge status={shown.status} />
                <OriginBadge origin={shown.origin} />
              </div>
              <SheetTitle className="pt-1 font-mono text-base">{shown.alert_id}</SheetTitle>
              <SheetDescription>
                <AnomalyTypeLabel type={shown.anomaly_type} className="text-foreground" />
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{shown.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Observed</p>
                  <p className="tabular mt-1 text-lg font-semibold text-foreground">
                    {formatNumber(shown.observed_value, 1)} <span className="text-xs font-normal text-muted-foreground">{shown.unit}</span>
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Expected</p>
                  <p className="tabular mt-1 text-lg font-semibold text-foreground">
                    {formatNumber(shown.expected_value, 1)} <span className="text-xs font-normal text-muted-foreground">{shown.unit}</span>
                  </p>
                </div>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">
                Deviation from expected baseline:{' '}
                <span className="tabular font-medium text-foreground">
                  {deviation > 0 ? '+' : ''}
                  {formatNumber(deviation, 1)}%
                </span>
              </p>

              <dl className="divide-y divide-border">
                <DetailRow label="Meter ID">
                  <span className="font-mono text-xs">{shown.meter_id}</span>
                </DetailRow>
                <DetailRow label="Transformer">
                  <span className="font-mono text-xs">{shown.transformer_id}</span>
                </DetailRow>
                <DetailRow label="Location">
                  {shown.location}, {shown.region}
                </DetailRow>
                <DetailRow label="Meter type">{METER_TYPE_LABELS[shown.meter_type]}</DetailRow>
                <DetailRow label="Detected at">{formatDateTime(shown.timestamp)}</DetailRow>
              </dl>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Update status</h3>
                  <DemoOnlyBadge label="Stored in session only" />
                </div>
                {canUpdate ? (
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_ACTIONS.filter((s) => s !== shown.status).map((status) => (
                      <Button
                        key={status}
                        variant={status === 'resolved' ? 'default' : 'outline'}
                        size="sm"
                        disabled={pending !== null}
                        onClick={() => updateStatus(status)}
                      >
                        {pending === status && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
                        {status === 'open' ? 'Reopen' : `Mark ${STATUS_LABELS[status].toLowerCase()}`}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Your role can view alerts but not change their status.</p>
                )}
                {error && (
                  <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3.5" aria-hidden="true" />
                    {error}
                  </p>
                )}
              </div>
            </div>

            <SheetFooter className="border-t border-border">
              <p className="text-xs text-muted-foreground">
                In production, status changes would be written through the backend API and recorded in an audit log.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
