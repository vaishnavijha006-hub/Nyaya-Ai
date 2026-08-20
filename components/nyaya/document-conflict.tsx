"use client"

import * as React from "react"
import { ShieldAlert, ArrowRight, AlertTriangle, FileText, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface DocumentConflictData {
  id: string;
  factKey: string;
  memoryValue: string;
  documentValue: string;
  documentSource: string;
  description: string;
}

interface DocumentConflictProps {
  conflicts?: DocumentConflictData[];
  onResolve?: (conflictId: string, acceptedSource: 'memory' | 'document') => void;
  className?: string;
}

const defaultConflicts: DocumentConflictData[] = [
  {
    id: "conf-1",
    factKey: "Date of Incident",
    memoryValue: "15-August-2025 (User Stated)",
    documentValue: "10-August-2025",
    documentSource: "FIR Copy.pdf",
    description: "The date of the incident you mentioned differs from the date recorded in the uploaded FIR.",
  }
];

export function DocumentConflict({ conflicts = defaultConflicts, onResolve, className = "" }: DocumentConflictProps) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <Card className={`w-full border-destructive/20 bg-destructive/5 ${className}`}>
      <CardHeader className="pb-3 border-b border-destructive/10">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-5 w-5" />
          <CardTitle className="text-lg">Document Conflicts Detected</CardTitle>
        </div>
        <CardDescription>
          Contradictions found between your statements and uploaded documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {conflicts.map((conflict) => (
          <div key={conflict.id} className="bg-background rounded-lg border border-destructive/20 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Contradiction regarding: {conflict.factKey}</h4>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{conflict.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Memory Box */}
                  <div className="p-3 rounded-md border border-border bg-muted/20 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        You Stated
                      </div>
                      <div className="text-sm font-medium p-2 bg-background rounded border line-through opacity-70">
                        {conflict.memoryValue}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => onResolve?.(conflict.id, 'memory')}
                    >
                      Keep Statement
                    </Button>
                  </div>
                  
                  {/* Document Box */}
                  <div className="p-3 rounded-md border border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Found in {conflict.documentSource}
                      </div>
                      <div className="text-sm font-medium p-2 bg-background rounded border border-emerald-200/50">
                        {conflict.documentValue}
                      </div>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                      onClick={() => onResolve?.(conflict.id, 'document')}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Accept Document Fact
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
