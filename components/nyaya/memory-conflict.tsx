"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight, Check, X } from "lucide-react"

export interface ConflictRecord {
  id: string
  factKey: string
  oldValue: string
  newValue: string
  confidence: "high" | "medium" | "low"
  context?: string
}

interface MemoryConflictProps {
  conflict: ConflictRecord
  onResolve: (id: string, action: "keep_old" | "accept_new" | "manual_edit") => void
}

export function MemoryConflict({ conflict, onResolve }: MemoryConflictProps) {
  return (
    <Card className="border-warning/50 bg-warning/5 dark:bg-warning/10 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
          Memory Conflict Detected
        </CardTitle>
        <CardDescription className="text-amber-600/80 dark:text-amber-300/80">
          New information contradicts an existing case fact.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Fact: {conflict.factKey}
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
            <div className="flex-1 p-3 rounded-lg border bg-card/50">
              <span className="text-xs text-muted-foreground block mb-1">Existing Value</span>
              <span className="text-sm line-through text-muted-foreground">{conflict.oldValue}</span>
            </div>
            <div className="hidden sm:flex items-center justify-center shrink-0">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <span className="text-xs text-primary/80 font-medium block mb-1">New Value</span>
              <span className="text-sm font-medium">{conflict.newValue}</span>
            </div>
          </div>
        </div>
        {conflict.context && (
          <div className="text-xs text-muted-foreground italic border-l-2 pl-3 py-1 bg-muted/30 rounded-r">
            "{conflict.context}"
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/20 mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onResolve(conflict.id, "keep_old")}
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          Keep Existing
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => onResolve(conflict.id, "accept_new")}
        >
          <Check className="h-4 w-4 mr-1" />
          Accept New
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onResolve(conflict.id, "manual_edit")}
          className="ml-auto"
        >
          Edit Manually
        </Button>
      </CardFooter>
    </Card>
  )
}
