import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-100',
        'placeholder:text-zinc-500',
        'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
        className,
      )}
      {...props}
    />
  )
}
