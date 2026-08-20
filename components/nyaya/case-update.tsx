import React from 'react';

export function CaseUpdate({ title, message, date }: { title: string; message: string; date: Date | string }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h5>
        <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(date).toLocaleDateString()}</span>
      </div>
      <p className="font-normal text-gray-700 dark:text-gray-400">{message}</p>
    </div>
  );
}
