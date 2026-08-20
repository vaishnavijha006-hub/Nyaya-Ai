import React from 'react';
import Link from 'next/link';
import { Plus, FileText, Search, Filter } from 'lucide-react';
import { ComplaintStatus, StatusType } from '@/components/nyaya/complaint-status';

const dummyComplaints = [
  { id: '1', title: 'Consumer Rights Violation', authority: 'Consumer Disputes Redressal Forum', status: 'pending' as StatusType, date: '2023-10-25T10:00:00Z' },
  { id: '2', title: 'Cyber Fraud Report', authority: 'Cyber Crime Police Station', status: 'under_review' as StatusType, date: '2023-10-20T14:30:00Z', ref: 'CYB-2023-892' },
  { id: '3', title: 'Property Dispute', authority: 'Civil Court', status: 'resolved' as StatusType, date: '2023-09-15T09:15:00Z', ref: 'CIV-2023-114' },
];

export default function ComplaintsDashboard() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complaints & E-Filing</h1>
          <p className="text-muted-foreground mt-1">Manage your drafts, submissions, and authority responses.</p>
        </div>
        <Link 
          href="/chat"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Complaint
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search complaints..." 
            className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <button className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      <div className="grid gap-4">
        {dummyComplaints.map(complaint => (
          <Link key={complaint.id} href={`/complaints/${complaint.id}`}>
            <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{complaint.title}</h3>
                  <p className="text-sm text-muted-foreground">{complaint.authority}</p>
                  <p className="text-xs text-muted-foreground mt-1">Updated: {new Date(complaint.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="md:w-64 shrink-0">
                <ComplaintStatus 
                  status={complaint.status} 
                  lastUpdated={complaint.date} 
                  referenceNumber={complaint.ref} 
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
