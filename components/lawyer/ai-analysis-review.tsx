import React from 'react';

export default function AiAnalysisReview() {
  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        AI Preliminary Analysis
      </h2>
      <div className="prose prose-sm max-w-none text-gray-700">
        <p>
          Based on the confirmed facts and verified sources, there is a strong prima facie case for <strong>retaliatory discharge</strong> under the Industrial Disputes Act, 1947. 
        </p>
        <p>
          The proximity of the safety report (July 10) to the termination (July 15) establishes a likely causal link. The employer may argue "loss of confidence" or performance issues, but the 5-year clean track record undermines this defense.
        </p>
        
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mt-4">
          <h4 className="text-indigo-800 font-semibold mb-2">Recommended Actions for Lawyer</h4>
          <ul className="list-disc list-inside text-indigo-900 space-y-1">
            <li>Verify if the safety hazard was reported in writing.</li>
            <li>Review employment contract for arbitration clauses.</li>
            <li>Draft demand letter for severance or reinstatement.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
