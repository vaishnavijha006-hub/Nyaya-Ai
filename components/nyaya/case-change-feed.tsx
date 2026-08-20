"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Activity, Plus, Trash2, Edit3, CheckCircle2 } from "lucide-react"

export type ChangeType = "added" | "updated" | "removed" | "verified"

export interface MemoryChange {
  id: string
  factKey: string
  oldValue?: string
  newValue?: string
  type: ChangeType
  timestamp: string
  source: "user" | "ai" | "system"
}

interface CaseChangeFeedProps {
  changes?: MemoryChange[]
}

const defaultChanges: MemoryChange[] = [
  {
    id: "c1",
    factKey: "Incident Date",
    oldValue: "Mid October",
    newValue: "Oct 12, 2023",
    type: "updated",
    timestamp: "2 mins ago",
    source: "user",
  },
  {
    id: "c2",
    factKey: "Location",
    newValue: "Sector 4, Main Market",
    type: "added",
    timestamp: "15 mins ago",
    source: "ai",
  },
  {
    id: "c3",
    factKey: "Opposing Party",
    newValue: "Local Vendor Assoc.",
    type: "verified",
    timestamp: "1 hour ago",
    source: "system",
  },
]

export function CaseChangeFeed({ changes = defaultChanges }: CaseChangeFeedProps) {
  const getChangeIcon = (type: ChangeType) => {
    switch (type) {
      case "added": return <Plus className="h-4 w-4 text-emerald-500" />
      case "updated": return <Edit3 className="h-4 w-4 text-blue-500" />
      case "removed": return <Trash2 className="h-4 w-4 text-destructive" />
      case "verified": return <CheckCircle2 className="h-4 w-4 text-violet-500" />
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Memory Activity Feed
        </CardTitle>
        <CardDescription>Recent updates to your case context.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {changes.map((change) => (
              <div key={change.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-slate-100 dark:bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {getChangeIcon(change.type)}
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm capitalize">{change.type}</span>
                      <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0 h-4">
                        {change.source}
                      </Badge>
                    </div>
                    <time className="text-xs text-muted-foreground">{change.timestamp}</time>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{change.factKey}</span>
                    {change.type === "updated" && change.oldValue && (
                      <div className="mt-1 flex flex-col gap-1 text-xs">
                        <span className="line-through text-muted-foreground">{change.oldValue}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{change.newValue}</span>
                      </div>
                    )}
                    {change.type === "added" && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Value: <span className="text-foreground font-medium">{change.newValue}</span>
                      </div>
                    )}
                    {change.type === "removed" && (
                      <div className="mt-1 text-xs text-muted-foreground line-through">
                        {change.oldValue}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {changes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
