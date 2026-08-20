import React from 'react';
import { History, ArrowRight } from 'lucide-react';

export interface RiskHistoryProps {
  history: {
    events: {
      id: string;
      date: string;
      description: string;
      mitigated: boolean;
    }[];
  };
}

export function RiskHistory({ history }: RiskHistoryProps) {
  if (!history || !history.events || history.events.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Prevention History</h3>
      </div>
      
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
        {history.events.map((event, index) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2">
               {event.mitigated ? (
                 <div className="w-2 h-2 rounded-full bg-green-500" />
               ) : (
                 <div className="w-2 h-2 rounded-full bg-orange-400" />
               )}
            </div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shadow-sm ml-8 md:ml-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {new Date(event.date).toLocaleDateString()}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${event.mitigated ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                  {event.mitigated ? 'Addressed' : 'Active'}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
