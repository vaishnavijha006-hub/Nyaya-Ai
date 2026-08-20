import React, { useState } from 'react';
import { Edit3, CheckCircle } from 'lucide-react';

interface DataCorrectionProps {
  correctionAppliedEvent?: any;
}

export function DataCorrection({ correctionAppliedEvent }: DataCorrectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [field, setField] = useState('');
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(!!correctionAppliedEvent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setIsOpen(false);
  };

  return (
    <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Edit3 className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-lg">Data Correction</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        If you notice inaccuracies in your personal details or case facts, submit a request to correct them.
      </p>

      {submitted && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Correction applied successfully.</span>
        </div>
      )}

      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-3 mt-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Information to Correct</label>
            <input 
              required
              value={field}
              onChange={e => setField(e.target.value)}
              placeholder="e.g. Phone Number, Address"
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correct Value</label>
            <textarea 
              required
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Submit Correction
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium border">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Request Correction
        </button>
      )}
    </div>
  );
}
