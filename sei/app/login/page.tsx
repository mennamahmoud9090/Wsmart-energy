import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Activity, ShieldAlert, UtilityPole } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import { Logo } from '@/components/brand/logo'

export const metadata: Metadata = {
  title: 'Sign in',
}

const HIGHLIGHTS = [
  { icon: Activity, title: 'Consumption analytics', text: '15-minute interval readings across 100,000+ simulated meters.' },
  { icon: UtilityPole, title: 'Grid & transformer health', text: 'Loading, peak demand and voltage monitoring by site.' },
  { icon: ShieldAlert, title: 'Anomaly detection', text: 'Load surges, voltage drops and irregular consumption.' },
]

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Logo inverted />
        <div className="flex max-w-md flex-col gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium tracking-widest text-cyan uppercase">Smart grid analytics</p>
            <h2 className="text-3xl font-semibold leading-tight text-white text-balance">
              Turn smart meter streams into grid intelligence.
            </h2>
            <p className="text-sm leading-relaxed text-sidebar-foreground/70">
              A presentation and analytics interface for a Kafka, Spark, Iceberg and Snowflake data platform.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-cyan">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-white">{title}</span>
                  <span className="text-xs leading-relaxed text-sidebar-foreground/65">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Big Data Engineering graduation project · All data simulated</p>
      </section>

      <main className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground">Access the Smart Energy Intelligence Platform.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
