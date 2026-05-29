import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white',
        'placeholder:text-zinc-500 transition-colors duration-200',
        'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
