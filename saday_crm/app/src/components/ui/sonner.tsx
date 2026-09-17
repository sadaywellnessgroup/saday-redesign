'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/* Brand-themed toast host. Mounted once in the root layout. */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-ink group-[.toaster]:shadow-feather-lg group-[.toaster]:rounded-softer group-[.toaster]:border-0',
          description: 'group-[.toast]:text-ink-soft',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-lilac-tint group-[.toast]:text-indigo',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
