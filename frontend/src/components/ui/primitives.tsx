import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ---------- Button ----------
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none'
    const variants = {
      primary: 'bg-accent text-white hover:bg-accent/90',
      secondary: 'bg-white/5 text-white border border-border hover:bg-white/10',
      danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
      ghost: 'text-muted hover:text-white hover:bg-white/5',
    }
    return (
      <button ref={ref} className={cn(base, variants[variant], className)} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ---------- Input ----------
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border border-border bg-panel px-3.5 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light',
            error && 'border-danger focus:border-danger focus:ring-danger',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ---------- Textarea ----------
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white">{label}</label>}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border border-border bg-panel px-3.5 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ---------- Select ----------
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }>(
  ({ className, label, error, id, children, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white">{label}</label>}
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border border-border bg-panel px-3.5 py-2.5 text-sm text-white focus:border-accent-light focus:outline-none focus:ring-1 focus:ring-accent-light',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
)
Select.displayName = 'Select'

// ---------- Card ----------
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('glass rounded-2xl p-5', className)}>{children}</div>
}

// ---------- Badge ----------
export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', className)}>
      {children}
    </span>
  )
}

// ---------- Skeleton ----------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />
}

// ---------- Empty State ----------
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <Icon className="mb-3 h-10 w-10 text-muted" />
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
