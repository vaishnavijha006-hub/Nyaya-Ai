import React from 'react';
import LawyerCaseOverview from '@/components/lawyer/lawyer-case-overview';
import ConfirmedFacts from '@/components/lawyer/confirmed-facts';
import VerifiedSources from '@/components/lawyer/verified-sources';
import AiAnalysisReview from '@/components/lawyer/ai-analysis-review';
import LawyerReviewForm from '@/components/lawyer/lawyer-review-form';
import { NotificationCenter } from '@/components/nyaya/notification-center';
import { AppointmentCard } from '@/components/nyaya/appointment-card';
import { DeadlineAlert } from '@/components/nyaya/deadline-alert';
import { SourceReviewWarning } from '@/components/nyaya/source-review-warning';
import { ContinuityQueue } from '@/components/nyaya/continuity-queue';

export default function LawyerDashboard() {
  const mockNotifications = [
    { id: "1", title: "New Document Uploaded", message: "Client uploaded ID proof for Case-120", type: "info", channel: "in-app", timestamp: "10 mins ago", read: false },
    { id: "2", title: "Hearing Scheduled", message: "Case-45 hearing is set for Nov 5.", type: "success", channel: "email", timestamp: "1 hour ago", read: false },
  ] as any;

  const mockAppointment = {
    id: "app-1", lawyerName: "Rahul Kumar (Client)", date: "Oct 28, 2023", time: "10:30 AM", mode: "video", status: "scheduled"
  } as any;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Lawyer Workspace & Review Engine</h1>
          <div className="flex gap-4">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Queue: 3 Pending</span>
          </div>
        </header>

        <DeadlineAlert 
          title="Filing Deadline Approaching" 
          date="Oct 30, 2023" 
          description="Case-45 needs a finalized drafted response." 
          daysRemaining={2} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 lg:col-span-2 space-y-8">
            <ContinuityQueue cases={[
              { id: 'Case-112', title: 'Eviction Notice Dispute', reason: 'Owner unresponsive for 5 days. Approaching legal deadline.', priority: 'high' },
              { id: 'Case-89', title: 'Contract Breach', reason: 'System could not verify key documents, requires human review.', priority: 'medium' }
            ]} />
            <LawyerCaseOverview />
            <ConfirmedFacts />
            <VerifiedSources />
            <AiAnalysisReview />
          </div>
          
          <div className="col-span-1 space-y-8">
            <div className="sticky top-8 space-y-8">
              <LawyerReviewForm />
              
              <SourceReviewWarning 
                sourceTitle="Indian Penal Code, Section 34"
                issueDescription="Repealed by Bharatiya Nyaya Sanhita, 2023. Update references in Case-45 to BNS Section 3(5)."
                onReviewClick={() => console.log('Reviewing source')}
              />

              <div className="h-[300px]">
                <NotificationCenter notifications={mockNotifications} />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Upcoming Appointments</h3>
                <AppointmentCard appointment={mockAppointment} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
