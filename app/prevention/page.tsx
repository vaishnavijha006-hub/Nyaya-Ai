import React from 'react';
import { PreventionCenter } from '@/components/nyaya/prevention-center';
import { Shield, ShieldAlert, BookOpen, Clock } from 'lucide-react';

export default function GlobalPreventionPortal() {
  // Mock data for the global portal
  const activeRiskSignals = [
    {
      type: 'contract_expiry',
      description: 'Your lease agreement expires in 30 days. No renewal documented yet.',
      severity: 'medium',
      actionRecommendation: 'Review renewal terms and send notice if continuing.'
    },
    {
      type: 'regulatory_change',
      description: 'New data protection rules apply to your e-commerce business starting next month.',
      severity: 'high',
      actionRecommendation: 'Update privacy policy on your website.'
    }
  ];

  const evidenceGaps = [
    {
      description: 'Missing signature on employment agreement for Jane Doe.',
      impact: 'Limits enforceability of non-compete clauses.',
      suggestion: 'Request employee to sign the finalized document via the portal.'
    }
  ];

  const preventionChecklist = {
    id: 'startup-compliance-1',
    title: 'Quarterly Compliance Review',
    description: 'Routine checks to ensure standard legal hygiene for your business.',
    items: [
      { id: 'c1', label: 'Verify all employee IP assignments are signed', isCompleted: true, rationale: 'Protects company ownership of created assets.' },
      { id: 'c2', label: 'Renew annual licenses', isCompleted: false, rationale: 'Prevents operational disruption and fines.' },
      { id: 'c3', label: 'Review vendor contracts for automatic renewals', isCompleted: false, rationale: 'Avoids unwanted long-term commitments.' }
    ]
  };

  const riskHistory = {
    events: [
      { id: 'h1', date: new Date(Date.now() - 86400000 * 5).toISOString(), description: 'Addressed missing tax filing for Q2', mitigated: true },
      { id: 'h2', date: new Date(Date.now() - 86400000 * 12).toISOString(), description: 'Updated privacy policy according to new regulations', mitigated: true },
      { id: 'h3', date: new Date(Date.now() - 86400000 * 20).toISOString(), description: 'Unresolved trademark dispute letter received', mitigated: false }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Global Prevention Portal
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Proactive monitoring of your legal health across all activities.
          </p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          Run Full Audit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{activeRiskSignals.length}</span>
          </div>
          <p className="font-medium text-gray-900 dark:text-white">Active Risks</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Require attention</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{evidenceGaps.length}</span>
          </div>
          <p className="font-medium text-gray-900 dark:text-white">Evidence Gaps</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Missing documentation</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {preventionChecklist.items.filter(i => i.isCompleted).length}/{preventionChecklist.items.length}
            </span>
          </div>
          <p className="font-medium text-gray-900 dark:text-white">Compliance tasks</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed this quarter</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">98%</span>
          </div>
          <p className="font-medium text-gray-900 dark:text-white">Health Score</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Based on history</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <PreventionCenter 
          riskSignals={activeRiskSignals}
          evidenceGaps={evidenceGaps}
          checklist={preventionChecklist}
          history={riskHistory}
        />
      </div>
    </div>
  );
}
