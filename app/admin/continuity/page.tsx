"use client";

import React, { useState } from 'react';
import { Shield, Activity, Users, AlertTriangle, Play } from 'lucide-react';
import { ContinuityQueue } from '@/components/nyaya/continuity-queue';
import { useStreamingChat } from '@/hooks/use-streaming-chat';

export default function AdminContinuityPage() {
  const { state, start } = useStreamingChat({
    question: "Run system continuity check",
  });

  const orphanedCases = [
    { id: 'Case-992', title: 'Property Dispute', reason: 'Lawyer license expired. Automated handoff failed.', priority: 'high' as const },
    { id: 'Case-401', title: 'Divorce Proceeding', reason: 'User unresponsive for 30 days. Action required.', priority: 'medium' as const },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="h-8 w-8 text-indigo-600" />
              Continuity & Operations Engine
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Monitor and manage system-wide continuity and orphaned cases.</p>
          </div>
          <button 
            onClick={() => start()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Play className="h-4 w-4" />
            {state.isStreaming ? 'Running Check...' : 'Run Continuity Check'}
          </button>
        </header>

        {/* Real-time Events */}
        {(state.continuityCheckStarted || state.continuityStatusUpdated || state.continuityAttentionRequired || state.continuityInterventionCreated || state.continuityOwnerChanged) && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-800 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              Live Operations Intelligence
            </h2>
            <div className="space-y-2 text-sm">
              {state.continuityCheckStarted && <div className="text-blue-600">Continuity check initiated...</div>}
              {state.continuityStatusUpdated && <div className="text-green-600">Status updated: {state.continuityStatusUpdated.status || 'Verified'}</div>}
              {state.continuityAttentionRequired && <div className="text-amber-600 font-medium">Attention required on {state.continuityAttentionRequired.casesCount || 'several'} cases.</div>}
              {state.continuityInterventionCreated && <div className="text-indigo-600">Intervention created: {state.continuityInterventionCreated.action || 'Auto-reassignment'}</div>}
              {state.continuityOwnerChanged && <div className="text-gray-600 dark:text-gray-300">Case reassigned to: {state.continuityOwnerChanged.owner || 'System Backup'}</div>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">System Health</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-4">99.9%</p>
            <p className="text-sm text-green-600 mt-1">Operational</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Active Interventions</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-4">12</p>
            <p className="text-sm text-amber-600 mt-1">Require attention</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Orphaned Cases</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-4">{orphanedCases.length}</p>
            <p className="text-sm text-red-600 mt-1">No active owner</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Orphaned Cases Queue</h2>
          <ContinuityQueue cases={orphanedCases} />
        </div>
      </div>
    </div>
  );
}
