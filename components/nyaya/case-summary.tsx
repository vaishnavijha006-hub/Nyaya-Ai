"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Calendar, MapPin, Users, AlertCircle } from "lucide-react"

interface MemoryFact {
  id: string
  key: string
  value: string
  confidence: "high" | "medium" | "low"
  category: "timeline" | "location" | "entity" | "context"
}

interface CaseSummaryProps {
  facts?: MemoryFact[]
}

const defaultFacts: MemoryFact[] = [
  { id: "1", key: "Incident Date", value: "Oct 12, 2023", confidence: "high", category: "timeline" },
  { id: "2", key: "Location", value: "Sector 4, Main Market", confidence: "high", category: "location" },
  { id: "3", key: "Opposing Party", value: "Local Vendor Assoc.", confidence: "medium", category: "entity" },
  { id: "4", key: "Core Issue", value: "Dispute over shop allocation", confidence: "high", category: "context" },
]

export function CaseSummary({ facts = defaultFacts }: CaseSummaryProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "timeline": return <Calendar className="h-4 w-4 text-muted-foreground" />
      case "location": return <MapPin className="h-4 w-4 text-muted-foreground" />
      case "entity": return <Users className="h-4 w-4 text-muted-foreground" />
      default: return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Case Summary
        </CardTitle>
        <CardDescription>Key facts extracted from your interactions.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(fact.category)}
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{fact.key}</span>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getConfidenceColor(fact.confidence)}`}>
                    {fact.confidence}
                  </Badge>
                </div>
                <div className="text-sm font-medium mt-1 leading-snug">{fact.value}</div>
              </div>
            ))}
          </div>
          {facts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No facts established yet. Continue discussing the case to build memory.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
