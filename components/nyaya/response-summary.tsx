import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';

export interface ResponseSummaryData {
  summary: string;
  keyPoints: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  analysisDate: string;
}

export function ResponseSummary({ response }: { response: ResponseSummaryData }) {
  const sentimentColors = {
    positive: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    neutral: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    negative: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
  };

  const sentimentClass = response.sentiment ? sentimentColors[response.sentiment] : sentimentColors.neutral;

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-indigo-500" />
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Authority Response Analysis</h3>
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4">{response.summary}</p>
      
      {response.keyPoints && response.keyPoints.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Points:</h4>
          <ul className="space-y-2">
            {response.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        {response.sentiment && (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${sentimentClass}`}>
            {response.sentiment.charAt(0).toUpperCase() + response.sentiment.slice(1)} Tone
          </span>
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Analyzed on: {new Date(response.analysisDate).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
