import React from 'react';

export default function ConfirmedFacts() {
  const facts = [
    { id: 1, fact: "Employment started on March 15, 2021", source: "Offer Letter", confirmed: true },
    { id: 2, fact: "Safety hazard reported to HR on July 10, 2026", source: "Email Thread", confirmed: true },
    { id: 3, fact: "Termination notice received on July 15, 2026", source: "Termination Letter", confirmed: true },
  ];

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center justify-between">
        <span>Confirmed Facts</span>
        <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">AI Extracted</span>
      </h2>
      <ul className="space-y-3">
        {facts.map((f) => (
          <li key={f.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="mt-1">
              {f.confirmed ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">{f.fact}</p>
              <p className="text-sm text-gray-500 mt-1">Source: {f.source}</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Edit</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
