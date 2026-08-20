import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ComplaintStatus, StatusType } from '@/components/nyaya/complaint-status';
import { AuthorityRecommendation } from '@/components/nyaya/authority-recommendation';
import { ComplaintBuilder } from '@/components/nyaya/complaint-builder';
import { SubmissionReadiness } from '@/components/nyaya/submission-readiness';
import { SubmissionOptions } from '@/components/nyaya/submission-options';
import { AuthorityResponse } from '@/components/nyaya/authority-response';
import { FollowupCard } from '@/components/nyaya/followup-card';

export default function ComplaintDetail({ params }: { params: { complaintId: string } }) {
  // Dummy data for demonstration
  const complaint = {
    id: params.complaintId,
    title: 'Cyber Fraud Report',
    status: 'under_review' as StatusType,
    lastUpdated: '2023-10-20T14:30:00Z',
    referenceNumber: 'CYB-2023-892',
    draft: 'This is a detailed report regarding an online financial fraud...',
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6">
        <Link href="/complaints" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Complaints
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{complaint.title}</h1>
        <p className="text-muted-foreground mt-1">ID: {complaint.id}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <AuthorityRecommendation 
            authority="Cyber Crime Police Station"
            reason="Based on the financial nature of the online fraud described in your case, this is the primary jurisdiction for investigation."
            confidenceScore={95}
          />

          <ComplaintBuilder 
            initialDraft={complaint.draft}
            onSave={(content) => console.log('Saved:', content)}
            onSubmit={(content) => console.log('Submitted:', content)}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Authority Communications</h3>
            <div className="space-y-4">
              <AuthorityResponse 
                authorityName="Cyber Crime Cell"
                responseDate="2023-10-21T10:00:00Z"
                message="Your complaint has been received and assigned to an investigating officer. Please provide any additional transaction statements."
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <ComplaintStatus 
            status={complaint.status}
            lastUpdated={complaint.lastUpdated}
            referenceNumber={complaint.referenceNumber}
            statusMessage="Awaiting additional documents from complainant."
          />

          <SubmissionReadiness 
            score={85}
            requirements={[
              { id: '1', description: 'Detailed timeline of events', isMet: true },
              { id: '2', description: 'Transaction IDs and amounts', isMet: true },
              { id: '3', description: 'Bank statement attachments', isMet: false },
            ]}
          />

          <SubmissionOptions 
            options={[
              {
                id: '1',
                title: 'National Cyber Crime Portal',
                description: 'Official portal for reporting cyber crimes in India.',
                type: 'portal'
              },
              {
                id: '2',
                title: 'Local Police Station',
                description: 'Visit the nearest station for physical filing.',
                type: 'physical'
              }
            ]}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Required Actions</h3>
            <FollowupCard 
              title="Upload Bank Statements"
              description="The investigating officer has requested the last 3 months of bank statements."
              dueDate="2023-10-28T00:00:00Z"
              isUrgent={true}
              onAction={() => console.log('Action taken')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
