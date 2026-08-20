import React from 'react';
import { SiteHeader } from '@/components/nyaya/site-header';
import { Activity, ShieldAlert, CheckCircle, Database, Search } from 'lucide-react';

export default function AdminPrivacyDashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container max-w-7xl py-8 mx-auto px-4">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Privacy Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Monitor data rights requests, retention holds, and overall privacy compliance.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-800">Export Report</button>
          </div>
        </div>

        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-semibold mb-1">Strict PII Segregation Active</p>
            <p>All Personally Identifiable Information (PII) is masked or completely redacted in this view. As an administrator, you are granted operational visibility to manage workflows, but you cannot view user data without explicit cryptographic consent or a verifiable legal warrant.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-6 bg-card border rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-sm text-muted-foreground">Pending Deletions</h3>
              <ShieldAlert className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold">14</p>
            <p className="text-xs text-muted-foreground mt-1 text-red-500">Requires review</p>
          </div>
          
          <div className="p-6 bg-card border rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-sm text-muted-foreground">Export Queue</h3>
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs text-muted-foreground mt-1">Processing...</p>
          </div>

          <div className="p-6 bg-card border rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-sm text-muted-foreground">Correction Requests</h3>
              <Activity className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">23</p>
            <p className="text-xs text-muted-foreground mt-1">In triage</p>
          </div>

          <div className="p-6 bg-card border rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-sm text-muted-foreground">Compliance Score</h3>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">99.8%</p>
            <p className="text-xs text-muted-foreground mt-1 text-green-500">All systems healthy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-card border rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Active Retention Holds</h2>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search cases..." className="pl-9 pr-4 py-1.5 text-sm border rounded-md bg-transparent" />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Case ID</th>
                    <th className="px-4 py-3 font-medium">Hold Reason</th>
                    <th className="px-4 py-3 font-medium">Date Applied</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b">
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">CASE-9921</td>
                    <td className="px-4 py-3">Legal Dispute</td>
                    <td className="px-4 py-3">2026-08-10</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded text-xs font-medium">Active Hold</span></td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">CASE-8834</td>
                    <td className="px-4 py-3">Court Order</td>
                    <td className="px-4 py-3">2026-07-22</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded text-xs font-medium">Active Hold</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-card border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">Data Rights Queue</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Data Deletion Request</p>
                      <p className="text-xs text-muted-foreground mt-0.5">User USR-332 • Submitted 2 hrs ago</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-secondary">Review</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
