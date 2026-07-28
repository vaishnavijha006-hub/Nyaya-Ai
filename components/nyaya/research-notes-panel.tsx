'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Citation } from '@/components/nyaya/citation-card';
import { toast } from 'sonner';

interface ResearchNotesPanelProps {
  answer: string;
  citations: Citation[];
}

export function ResearchNotesPanel({ answer, citations }: ResearchNotesPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [notes, setNotes] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const generateNotes = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/research/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer,
          sources: citations.map((c) => ({
            primary_article: c.article_number || '',
            page: c.page || null,
            content_preview: c.snippet || '',
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Notes generation backend request failed');
      }

      const data = await res.json();
      setNotes(data.notes);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate study research notes');
    } finally {
      setLoading(false);
    }
  };

  const copyNotes = async () => {
    if (!notes) return;
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Notes copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="mt-4 border-t border-border/40 pt-4">
      {!notes && !loading ? (
        <Button
          variant="outline"
          size="sm"
          onClick={generateNotes}
          className="w-full sm:w-auto gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-semibold rounded-xl"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Generate AI Research Notes
        </Button>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-muted/10 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 bg-muted/20">
            <span className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <FileText className="h-3.5 w-3.5 text-primary" />
              AI Research Notes (iNSIGHTS Assisted)
            </span>
            {notes && (
              <Button
                variant="ghost"
                size="icon"
                onClick={copyNotes}
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
          <div className="p-4 min-h-[80px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Synthesizing Constitutional references...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
