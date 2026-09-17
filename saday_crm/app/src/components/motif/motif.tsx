import Image from 'next/image';
import { cn } from '@/lib/utils';

/* Available motif slugs — copied 1:1 from _refs/motifs/*.svg into
 * public/motifs/ (see docs/architecture.md §1, DECISION_LOG D-002). */
export const MOTIFS = [
  'anahata',
  'chandra',
  'deepa',
  'kamal-jali',
  'lotus',
  'mandala',
  'namaste',
  'nila-lotus',
  'omkara',
  'peacock-feather',
  'peacock',
  'surya',
  'tree-circle',
  'tree-hero',
  'waves',
] as const;

export type MotifName = (typeof MOTIFS)[number];

export function Motif({
  name,
  size = 120,
  className,
}: {
  name: MotifName;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={`/motifs/${name}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn('motif', className)}
    />
  );
}
