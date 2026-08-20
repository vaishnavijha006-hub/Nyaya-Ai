import React from 'react';
import { CalendarClock, ArrowRight } from 'lucide-react';

interface FollowupCardProps {
  title: string;
  description: string;
  dueDate: string;
  isUrgent?: boolean;
  onAction?: () => void;
}

export function FollowupCard({ title, description, dueDate, isUrgent, onAction }: FollowupCardProps) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${isUrgent ? 'border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20' : 'border-border bg-card'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            {isUrgent && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/50 dark:text-red-400">
                Urgent
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Take Action
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
