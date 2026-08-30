'use client';

import * as React from 'react';
import { CheckCircle2, Edit3, HelpCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getCanonicalCaseState, saveCanonicalCaseState, CaseFact } from '@/lib/case-state-manager';

export function FactConfirmationCard({ caseId = 'case-1', className }: { caseId?: string; className?: string }) {
  const [facts, setFacts] = React.useState<CaseFact[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');

  React.useEffect(() => {
    const state = getCanonicalCaseState(caseId);
    setFacts(state.facts);
  }, [caseId]);

  const handleConfirm = (factId: string) => {
    const state = getCanonicalCaseState(caseId);
    const updated = state.facts.map((f) => (f.id === factId ? { ...f, status: 'CONFIRMED' as const } : f));
    state.facts = updated;
    saveCanonicalCaseState(state);
    setFacts(updated);
    toast.success('Fact confirmed by citizen');
  };

  const handleSaveEdit = (factId: string) => {
    if (!editValue.trim()) return;
    const state = getCanonicalCaseState(caseId);
    const updated = state.facts.map((f) => (f.id === factId ? { ...f, value: editValue, status: 'CONFIRMED' as const } : f));
    state.facts = updated;
    saveCanonicalCaseState(state);
    setFacts(updated);
    setEditingId(null);
    toast.success('Fact updated cleanly');
  };

  return (
    <div className={cn('legal-card p-5 space-y-4 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Fact Understanding &amp; Confirmation
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-bold uppercase text-emerald-700 border-emerald-500/40">
          Citizen Review
        </Badge>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Review the facts extracted by Nyaya AI. Confirm or correct details to ensure downstream legal analysis remains 100% accurate.
      </p>

      <div className="space-y-2.5">
        {facts.map((f) => (
          <div key={f.id} className="p-3 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-xs">{f.label}:</span>
                {editingId === f.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="px-2 py-0.5 rounded border border-border bg-background text-xs"
                  />
                ) : (
                  <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs">{f.value}</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Source: {f.source}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {f.status === 'CONFIRMED' ? (
                <Badge className="bg-emerald-600 text-white text-[9px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Confirmed
                </Badge>
              ) : editingId === f.id ? (
                <Button size="sm" onClick={() => handleSaveEdit(f.id)} className="h-7 text-[10px] bg-emerald-600 text-white">
                  Save
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleConfirm(f.id)} className="h-7 text-[10px] border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(f.id);
                      setEditValue(f.value);
                    }}
                    className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 className="h-3 w-3" /> Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
