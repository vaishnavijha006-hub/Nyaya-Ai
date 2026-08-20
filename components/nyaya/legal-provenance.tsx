import { History } from "lucide-react";

export interface ProvenanceStep {
  date: string;
  action: string;
  authority: string;
}

interface LegalProvenanceProps {
  history: ProvenanceStep[];
}

export function LegalProvenance({ history }: LegalProvenanceProps) {
  if (!history || history.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <History className="h-4 w-4" />
        Source Provenance & History
      </div>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {history.map((step, index) => (
          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
               <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border bg-card shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-primary">{step.date}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{step.action}</p>
              <p className="text-xs text-muted-foreground mt-1">{step.authority}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
