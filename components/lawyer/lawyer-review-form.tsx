'use client';
import React, { useState } from 'react';

export default function LawyerReviewForm() {
  const [status, setStatus] = useState('reviewing');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to submit the review back to the system and notify the user
    console.log({ status, notes });
    alert('Review submitted and user notified.');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Human-in-the-Loop Decision</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
          >
            <option value="reviewing">Still Reviewing</option>
            <option value="approved">Approve AI Strategy</option>
            <option value="modified">Approve with Modifications</option>
            <option value="rejected">Reject / Require Manual Handling</option>
            <option value="message_user">Send Message to Client</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes / Message to Client</label>
          <textarea 
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
            placeholder="Type your notes or message here..."
          ></textarea>
        </div>

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Submit Decision
        </button>
      </form>
    </div>
  );
}
