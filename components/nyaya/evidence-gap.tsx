"use client"

import * as React from "react"
import { AlertCircle, FileWarning, Search, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface GapData {
  id: string;
  gapType: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface EvidenceGapProps {
  gaps?: GapData[];
  onUpload?: (gapId: string) => void;
  className?: string;
}

const defaultGaps: GapData[] = [
  {
    id: "gap-1",
    gapType: "Missing Document",
    description: "You mentioned a termination letter, but no such document was uploaded.",
    impact: "high",
    recommendation: "Upload the termination letter to strengthen your case."
  }
];

export function EvidenceGap({ gaps = defaultGaps, onUpload, className = "" }: EvidenceGapProps) {
  if (!gaps || gaps.length === 0) return null;

  return (
    <Card className={`w-full border-amber-200/60 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 ${className}`}>
      <CardHeader className="pb-3 border-b border-amber-100 dark:border-amber-900/30">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
          <FileWarning className="h-5 w-5" />
          <CardTitle className="text-lg">Evidence Gaps Detected</CardTitle>
        </div>
        <CardDescription className="text-amber-700/80 dark:text-amber-500/80">
          Missing evidence could weaken your legal standing.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {gaps.map((gap) => (
          <div key={gap.id} className="p-4 rounded-lg bg-background border border-amber-200/50 dark:border-amber-900/50 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${gap.impact === 'high' ? 'bg-destructive' : gap.impact === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            
            <div className="pl-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                {gap.gapType}
                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-sm font-bold ${
                  gap.impact === 'high' ? 'bg-destructive/10 text-destructive' : 
                  gap.impact === 'medium' ? 'bg-amber-500/10 text-amber-600' : 
                  'bg-blue-500/10 text-blue-600'
                }`}>
                  {gap.impact} impact
                </span>
              </h4>
              <p className="text-sm text-muted-foreground mt-2">{gap.description}</p>
              
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-md">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Search className="h-4 w-4" />
                  {gap.recommendation}
                </div>
                <Button size="sm" onClick={() => onUpload?.(gap.id)} className="shrink-0 gap-1 h-8">
                  Upload Evidence
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
