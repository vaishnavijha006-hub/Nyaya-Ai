import { cn } from '@/lib/utils';
import { Scale } from 'lucide-react';

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-amber-500 border border-slate-800 shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <Scale className="h-4.5 w-4.5 text-amber-500" />
      </div>
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Nyaya<span className="text-amber-600 dark:text-amber-500"> AI</span>
        </span>
      )}
    </div>
  );
}
