import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

export interface DeadlineData {
  title: string;
  dueDate: string;
  description?: string;
  severity: 'high' | 'medium' | 'low';
  actionRequired?: string;
}

export function DeadlineCard({ deadline }: { deadline: DeadlineData }) {
  const isHighSeverity = deadline.severity === 'high';
  
  return (
    <div className={`p-4 rounded-lg border ${isHighSeverity ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
      <div className="flex items-start gap-3">
        <Clock className={`h-5 w-5 ${isHighSeverity ? 'text-red-500' : 'text-amber-500'}`} />
        <div>
          <h3 className={`font-semibold ${isHighSeverity ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
            Deadline Detected: {deadline.title}
          </h3>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
            <strong>Due Date:</strong> {new Date(deadline.dueDate).toLocaleDateString()}
          </p>
          {deadline.description && (
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{deadline.description}</p>
          )}
          {deadline.actionRequired && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium bg-white dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700">
              <AlertCircle className="h-4 w-4" />
              {deadline.actionRequired}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
