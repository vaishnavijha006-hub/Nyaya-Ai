import { Gavel } from "lucide-react";

export function LegalAnalysis({ data }: { data: any }) {
  if (!data) return null;
  
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Gavel className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-primary">Legal Analysis</h3>
      </div>
      <div className="space-y-3 text-sm">
        {data.summary && <p className="text-foreground leading-relaxed">{data.summary}</p>}
        {data.implications && data.implications.length > 0 && (
          <div>
            <span className="font-medium text-foreground">Implications:</span>
            <ul className="list-disc pl-5 mt-1.5 space-y-1 text-muted-foreground">
              {data.implications.map((imp: string, i: number) => (
                <li key={i}>{imp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
