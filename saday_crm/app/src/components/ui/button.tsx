import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_6px_22px_rgba(62,42,120,0.28)] hover:bg-indigo-deep hover:-translate-y-px',
        destructive: 'bg-destructive text-destructive-foreground shadow-feather hover:opacity-90',
        outline: 'bg-card text-primary shadow-feather hover:bg-lilac-tint',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-lilac-tint',
        ghost: 'text-primary hover:bg-lilac-tint',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 rounded-full px-4 text-[13px]',
        lg: 'h-12 rounded-full px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
