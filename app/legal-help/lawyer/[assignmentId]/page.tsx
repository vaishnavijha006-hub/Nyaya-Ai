import React from 'react';
import LawyerAssignmentStatus from '@/components/nyaya/lawyer-assignment-status';

export default function LawyerAssignmentPage({ params }: { params: { assignmentId: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Your Case is Under Legal Review</h1>
          <p className="mt-2 text-blue-100">Assignment ID: {params.assignmentId}</p>
        </div>
        <div className="p-8">
          <p className="text-gray-600 mb-8 text-center">
            Nyaya AI has analyzed your case and compiled the necessary facts and legal sources. It is currently being reviewed by a human legal expert to ensure accuracy and provide strategic counsel.
          </p>
          
          <LawyerAssignmentStatus />
          
          <div className="mt-8 border-t pt-6 text-center">
            <p className="text-sm text-gray-500">
              You will be notified once the lawyer completes their review or if they have any further questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
