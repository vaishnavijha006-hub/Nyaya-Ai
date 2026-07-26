import { cn } from '@/lib/utils';

export function TypingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-label="Nyaya is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-primary/80 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  );
}

export function ThinkingPulse({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        Researching legal sources…
      </div>
      <div className="space-y-2">
        {[90, 75, 82].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-shimmer"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}
