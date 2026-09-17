import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-lilac-tint text-indigo-deep',
        secondary: 'bg-cream text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)]',
        destructive: 'bg-terracotta-deep/12 text-terracotta-deep',
        outline: 'text-indigo shadow-[inset_0_0_0_1.5px_var(--line)]',
        turmeric: 'bg-turmeric/25 text-terracotta-deep',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
