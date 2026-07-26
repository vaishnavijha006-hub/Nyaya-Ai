import { cn } from '@/lib/utils';

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M12 2.5 4 6v5.5c0 4.6 3.2 8.9 8 10 4.8-1.1 8-5.4 8-10V6l-8-3.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.18"
            />
            <path d="M8.5 11.5l2.4 2.6 4.6-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute -inset-1 -z-10 rounded-2xl bg-primary/30 blur-md" />
      </div>
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight">
          Nyaya<span className="text-primary"> AI</span>
        </span>
      )}
    </div>
  );
}
