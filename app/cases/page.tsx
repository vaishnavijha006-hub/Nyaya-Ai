import React from 'react';
import Link from 'next/link';
import { NotificationCenter } from '@/components/nyaya/notification-center';
import { CommunicationSettings } from '@/components/nyaya/communication-settings';
import { AppointmentCard } from '@/components/nyaya/appointment-card';
import { DeadlineAlert } from '@/components/nyaya/deadline-alert';

export default function CasesDashboard() {
  // Mock data for cases
  const cases = [
    { id: 'case-1', title: 'Property Dispute', status: 'In Progress', updated: '2023-10-25' },
    { id: 'case-2', title: 'Employment Contract Review', status: 'Resolved', updated: '2023-10-20' },
  ];

  const mockNotifications = [
    { id: "1", title: "New Document Required", message: "Please upload your ID proof.", type: "warning", channel: "in-app", timestamp: "10 mins ago", read: false },
    { id: "2", title: "Appointment Confirmed", message: "Video call with Adv. Sharma", type: "success", channel: "email", timestamp: "2 hours ago", read: true },
  ] as any;

  const mockAppointment = {
    id: "app-1", lawyerName: "Adv. Rahul Sharma", date: "Oct 28, 2023", time: "10:30 AM", mode: "video", status: "scheduled"
  } as any;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Unified Case Dashboard</h1>
      
      <DeadlineAlert 
        title="Filing Deadline Approaching" 
        date="Oct 30, 2023" 
        description="You need to submit your property documents." 
        daysRemaining={2} 
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {cases.map((c) => (
              <Link href={`/cases/${c.id}`} key={c.id}>
                <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                  <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{c.title}</h5>
                  <p className="font-normal text-gray-700 dark:text-gray-400 mb-2">Status: {c.status}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {c.updated}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-[400px]">
              <NotificationCenter notifications={mockNotifications} />
            </div>
            <div>
              <CommunicationSettings />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Appointments</h3>
          <AppointmentCard appointment={mockAppointment} />
        </div>
      </div>
    </div>
  );
}
