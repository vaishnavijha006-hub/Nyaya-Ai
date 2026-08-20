import React from 'react';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export function CaseTasks({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="space-y-3">
      {tasks.map(task => (
        <li key={task.id} className="flex items-center space-x-3">
          <input type="checkbox" checked={task.completed} readOnly className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
          <span className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
            {task.title}
          </span>
        </li>
      ))}
    </ul>
  );
}
