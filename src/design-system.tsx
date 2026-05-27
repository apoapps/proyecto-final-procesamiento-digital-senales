import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export const ds = {
  space: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem'
  },
  radius: {
    none: '0px',
    control: '6px',
    artwork: '10px'
  },
  type: {
    eyebrow: 'text-[11px] font-semibold uppercase tracking-[0.16em]',
    title: 'text-2xl font-semibold tracking-tight',
    section: 'text-base font-semibold tracking-tight',
    body: 'text-sm leading-6',
    caption: 'text-xs leading-5'
  },
  surface: {
    app: 'bg-background text-foreground',
    rail: 'bg-[#f5f5f7] text-foreground',
    base: 'bg-background',
    subtle: 'bg-muted',
    inverted: 'bg-foreground text-background'
  },
  border: {
    default: 'border border-border',
    bottom: 'border-b border-border',
    right: 'border-r border-border',
    top: 'border-t border-border'
  },
  focus: 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
} as const;

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function AppShell({ sidebar, toolbar, children, inspector }: { sidebar: ReactNode; toolbar: ReactNode; children: ReactNode; inspector: ReactNode }) {
  return (
    <main className={cn('h-dvh overflow-hidden', ds.surface.app)}>
      <div className="grid h-full grid-rows-[56px_1fr]">
        {toolbar}
        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[264px_minmax(0,1fr)_316px]">
          {sidebar}
          {children}
          {inspector}
        </div>
      </div>
    </main>
  );
}

export function TopBar({ title, subtitle, actions }: { title: string; subtitle: string; actions: ReactNode }) {
  return (
    <header className={cn('flex items-center justify-between px-4', ds.border.bottom, ds.surface.base)}>
      <div className="min-w-0">
        <p className={cn(ds.type.eyebrow, 'text-muted-foreground')}>Proyecto Final PDS</p>
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}

export function Sidebar({ children }: { children: ReactNode }) {
  return <aside className={cn('min-h-0 overflow-y-auto p-4', ds.surface.rail, ds.border.right)}>{children}</aside>;
}

export function Workbench({ children }: { children: ReactNode }) {
  return <section className="min-h-0 overflow-y-auto bg-background p-4">{children}</section>;
}

export function Inspector({ children }: { children: ReactNode }) {
  return <aside className={cn('min-h-0 overflow-y-auto p-4', ds.surface.rail, 'lg:border-l lg:border-border')}>{children}</aside>;
}

export function BrandLockup({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('grid h-10 w-10 place-items-center', ds.surface.inverted)}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function SectionHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(ds.type.eyebrow, 'text-muted-foreground', className)}>{children}</p>;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn(ds.border.default, ds.surface.base, className)}>{children}</section>;
}

export function ToolbarButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-grid h-9 w-9 place-items-center border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40',
        ds.focus,
        className
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function PrimaryAction({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn('inline-flex h-10 items-center justify-center gap-2 bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-40', ds.focus, className)} type="button" {...props}>
      {children}
    </button>
  );
}

export function RangeField({
  label,
  valueLabel,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  valueLabel: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="flex items-center justify-between gap-4 text-sm">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{valueLabel}</span>
      </span>
      <input className={cn('mt-3 w-full accent-foreground', ds.focus)} type="range" {...props} />
    </label>
  );
}

export function SwitchField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={cn('flex h-10 cursor-pointer items-center justify-between px-3 text-sm', ds.border.default, ds.surface.base)}>
      <span>{label}</span>
      <input className={cn('h-4 w-4 accent-foreground', ds.focus)} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-r border-border p-2">
      <p className="truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-xs font-semibold">{value}</dd>
    </div>
  );
}

export function ArtworkFrame({ label, src }: { label: string; src: string }) {
  return (
    <figure className="relative aspect-square overflow-hidden bg-muted">
      <img className="h-full w-full object-contain" src={src} alt={label} />
      <figcaption className="absolute left-2 top-2 bg-background/95 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</figcaption>
    </figure>
  );
}
