'use client';
import React from 'react';

export default function LawyerAssignmentStatus() {
  // In a real app, this would use SSE or polling to get the latest status
  const steps = [
    { name: 'AI Analysis Complete', status: 'complete', description: 'Facts and laws extracted' },
    { name: 'Assigned to Lawyer', status: 'complete', description: 'Advocate Priya Sharma assigned' },
    { name: 'Under Review', status: 'current', description: 'Lawyer is reviewing your case details' },
    { name: 'Action Recommended', status: 'upcoming', description: 'Awaiting lawyer decision' },
  ];

  return (
    <div className="space-y-6">
      {steps.map((step, stepIdx) => (
        <div key={step.name} className="relative flex items-start">
          {stepIdx !== steps.length - 1 && (
            <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
          )}
          <div className="relative flex h-8 w-8 items-center justify-center bg-white">
            {step.status === 'complete' ? (
              <span className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center ring-8 ring-white">
                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            ) : step.status === 'current' ? (
              <span className="h-8 w-8 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center ring-8 ring-white">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
              </span>
            ) : (
              <span className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center ring-8 ring-white" />
            )}
          </div>
          <div className="ml-4 min-w-0 flex-1">
            <h3 className={`text-lg font-medium ${step.status === 'upcoming' ? 'text-gray-500' : 'text-gray-900'}`}>
              {step.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
