import React, { useState } from 'react';
import { FileText, Save, Send } from 'lucide-react';

interface ComplaintBuilderProps {
  initialDraft?: string;
  onSave?: (content: string) => void;
  onSubmit?: (content: string) => void;
}

export function ComplaintBuilder({ initialDraft = '', onSave, onSubmit }: ComplaintBuilderProps) {
  const [content, setContent] = useState(initialDraft);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold tracking-tight">Complaint Draft Builder</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave?.(content)}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={() => onSubmit?.(content)}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Send className="h-4 w-4" />
            Submit
          </button>
        </div>
      </div>
      <textarea
        className="min-h-[400px] w-full resize-y rounded-md border border-input bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing your complaint details here..."
      />
    </div>
  );
}
