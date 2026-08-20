import React from 'react';

export default function LawyerCaseOverview() {
  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Case Overview</h2>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500 block">Case ID</span>
            <span className="font-medium text-gray-900">#NY-2026-8902</span>
          </div>
          <div>
            <span className="text-gray-500 block">Category</span>
            <span className="font-medium text-gray-900">Employment Dispute</span>
          </div>
          <div>
            <span className="text-gray-500 block">Client Type</span>
            <span className="font-medium text-gray-900">Individual Employee</span>
          </div>
          <div>
            <span className="text-gray-500 block">Priority</span>
            <span className="font-medium text-red-600 bg-red-50 px-2 py-1 rounded">High - Deadline Approaching</span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-gray-500 block mb-1">Brief Description</span>
          <p className="text-gray-800 leading-relaxed">
            Client claims wrongful termination after raising safety concerns at the manufacturing facility. Client worked there for 5 years with positive reviews prior to the incident.
          </p>
        </div>
      </div>
    </section>
  );
}
