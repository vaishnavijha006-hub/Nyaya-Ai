import React from 'react';

export default function VerifiedSources() {
  const sources = [
    { id: 1, title: "Industrial Disputes Act, 1947", section: "Section 2(oo)", relevance: "High" },
    { id: 2, title: "Factories Act, 1948", section: "Chapter IV - Safety", relevance: "High" },
  ];

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center justify-between">
        <span>Verified Legal Sources</span>
        <span className="text-sm font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded">Retrieved by Engine</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map(source => (
          <div key={source.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
            <h3 className="font-medium text-gray-900">{source.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{source.section}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                Relevance: {source.relevance}
              </span>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">View Full Text &rarr;</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
