"use client"

import * as React from "react"
import { FileText, Tag, BarChart3, CheckCircle2, BrainCircuit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { VaultDocument } from "./document-vault"

interface Entity {
  type: string;
  value: string;
  confidence: number;
}

interface DocumentDetailProps {
  document: VaultDocument;
  entities?: Entity[];
  summary?: string;
  className?: string;
}

const defaultEntities: Entity[] = [
  { type: "Party", value: "Tech Solutions Pvt Ltd", confidence: 0.98 },
  { type: "Date", value: "15-May-2025", confidence: 0.95 },
  { type: "Obligation", value: "Notice Period 30 days", confidence: 0.88 },
];

export function DocumentDetail({ 
  document, 
  entities = defaultEntities, 
  summary = "This document establishes an employment agreement between the user and Tech Solutions Pvt Ltd, with a 30-day notice period clause.",
  className = "" 
}: DocumentDetailProps) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{document.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{document.type}</span>
                <span>•</span>
                <span>Uploaded {document.uploadDate}</span>
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Analyzed
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <BrainCircuit className="h-4 w-4" />
            AI Summary
          </h4>
          <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50">
            {summary}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4" />
            Extracted Entities
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entities.map((entity, i) => (
              <div key={i} className="flex flex-col p-3 rounded-md border border-border/60 bg-card">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {entity.type}
                </span>
                <span className="text-sm font-medium mb-2">{entity.value}</span>
                <div className="flex items-center gap-2 mt-auto">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${entity.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {Math.round(entity.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
