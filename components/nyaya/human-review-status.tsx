import * as React from 'react';
import { Users, FileWarning, CheckSquare } from 'lucide-react';

export function HumanReviewStatus({ reviews }: { reviews?: any[] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <CheckSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg">No Pending Reviews</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            All AI decisions and data sharing requests have been automatically validated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 border-b bg-amber-50/30 dark:bg-amber-950/10">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          <h3 className="font-semibold leading-none tracking-tight text-amber-900 dark:text-amber-100">Human Review Required</h3>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-400">
          The following decisions require lawyer intervention before they can be finalized.
        </p>
      </div>
      <div className="p-0">
        <ul className="divide-y">
          {reviews.map((review, i) => (
            <li key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                <FileWarning className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium leading-none">{review.title || 'Legal Assessment Review'}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{review.reason || 'AI confidence was below threshold for this case type. Requires human sign-off.'}</p>
                <div className="flex gap-2 pt-2">
                  <button className="inline-flex h-8 items-center justify-center rounded-md bg-amber-600 px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600">
                    Review Now
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
