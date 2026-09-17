import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Integer paise -> "₹1,500" display string (architecture.md §7). Never use
 * this to store or compute — display only. */
export function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100,
  );
}

/** "Dr. Aditya Agrawal" -> "AA" — shared by every initials-avatar fallback
 * (provider cards/profile, top bar, message bubbles). */
export function initials(name: string): string {
  const caps = name
    .split(' ')
    .filter((w) => w[0] && w[0] === w[0].toUpperCase() && /[A-Za-z]/.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return caps || name.slice(0, 2).toUpperCase();
}

/** IST wall-clock formatting (architecture.md §7 — every patient-facing
 * time is shown in Asia/Kolkata, explicitly, never the server/browser tz). */
export function formatISTDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatISTDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' });
}

export function formatISTTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' });
}

export function formatISTWeekdayShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}
