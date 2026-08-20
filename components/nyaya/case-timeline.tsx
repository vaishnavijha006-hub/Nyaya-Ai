import React from 'react';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: Date | string;
  status?: 'completed' | 'in-progress' | 'pending';
}

export function CaseTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
      {events.map((event, index) => (
        <div key={event.id} className="mb-10 ml-6">
          <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
            {event.status === 'completed' ? '✓' : event.status === 'in-progress' ? '↻' : '○'}
          </span>
          <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white">{event.title}</h3>
          <time className="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
            {new Date(event.date).toLocaleString()}
          </time>
          <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">{event.description}</p>
        </div>
      ))}
    </div>
  );
}
