import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/5 bg-zinc-900/50 p-6 backdrop-blur',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
