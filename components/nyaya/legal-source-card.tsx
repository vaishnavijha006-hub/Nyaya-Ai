import { BookOpen, ExternalLink } from "lucide-react";
import { LegalConfidence } from "./legal-confidence";
import { LegalSourceTrust } from "./legal-source-trust";

export function LegalSourceCard({ source }: { source: any }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">{source.title || "Legal Source"}</h4>
        </div>
        {source.confidence !== undefined && (
          <div className="flex flex-col items-end gap-1">
            <LegalSourceTrust level={source.trustLevel || "verified"} />
            <LegalConfidence score={source.confidence} />
          </div>
        )}
      </div>
      {source.snippet && (
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-1">{source.snippet}</p>
      )}
      {source.url && (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2">
          View source <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
