import React, { useState } from 'react';
import { Shield, FileEdit, Share2, History } from 'lucide-react';

export function CaseDataControls({ caseId }: { caseId: string }) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-lg">Case Data Controls</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Manage how your case data is stored, corrected, and shared.
      </p>

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => setShowCorrection(!showCorrection)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground border rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <FileEdit className="w-4 h-4" />
          Correct Case Facts
        </button>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground border rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <History className="w-4 h-4" />
          Sharing History
        </button>
      </div>

      {showCorrection && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/20 space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2"><FileEdit className="w-4 h-4" /> Fact Correction Request</h4>
          <textarea 
            placeholder="Describe what facts are incorrect in this case..."
            className="w-full text-sm p-3 rounded-md border bg-transparent"
            rows={3}
          ></textarea>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium">Submit Request</button>
        </div>
      )}

      {showHistory && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/20">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3"><Share2 className="w-4 h-4" /> Recent Sharing Events</h4>
          <ul className="space-y-3">
            <li className="text-sm border-b pb-2">
              <span className="font-medium">System Profiler</span> <span className="text-muted-foreground">accessed case metadata</span>
              <div className="text-xs text-muted-foreground mt-1">Today, 10:45 AM - Purpose: Risk Assessment</div>
            </li>
            <li className="text-sm border-b pb-2">
              <span className="font-medium text-red-600">Third-Party Analytics</span> <span className="text-muted-foreground">access blocked</span>
              <div className="text-xs text-muted-foreground mt-1">Yesterday - Reason: Consent missing</div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
