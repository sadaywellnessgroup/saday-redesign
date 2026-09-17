import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-2xl bg-cream px-4 py-2 text-[15px] text-ink shadow-[inset_0_0_0_1.5px_var(--line)] transition-shadow placeholder:text-ink-soft/60 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1.5px_var(--primary),0_0_0_4px_rgba(62,42,120,0.12)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
