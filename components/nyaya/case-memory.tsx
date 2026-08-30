"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaseSummary } from "./case-summary"
import { CaseChangeFeed } from "./case-change-feed"
import { MemoryConflict, ConflictRecord } from "./memory-conflict"
import { BrainCircuit, History, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CaseMemoryProps {
  conflicts?: ConflictRecord[]
  className?: string
}

const defaultConflicts: ConflictRecord[] = [
  {
    id: "conflict-1",
    factKey: "Opposing Party Name",
    oldValue: "Local Vendor Assoc.",
    newValue: "Municipal Vendor Committee",
    confidence: "high",
    context: "User mentioned they received a letter from the Municipal Vendor Committee, which contradicts the previously stated Opposing Party."
  }
]

export function CaseMemory({ conflicts = defaultConflicts, className = "" }: CaseMemoryProps) {
  const [activeConflicts, setActiveConflicts] = React.useState<ConflictRecord[]>(conflicts)
  const [activeTab, setActiveTab] = React.useState("summary")

  // Switch to conflicts tab if there are active conflicts and it's initialized
  React.useEffect(() => {
    if (activeConflicts.length > 0) {
      setActiveTab("conflicts")
    }
  }, [activeConflicts.length])

  const handleResolveConflict = (id: string, action: string) => {
    console.log(`Resolved conflict ${id} with action: ${action}`)
    setActiveConflicts((prev) => prev.filter(c => c.id !== id))
    
    // Switch to summary if no conflicts left
    if (activeConflicts.length <= 1) {
      setActiveTab("summary")
    }
  }

  return (
    <div className={`flex flex-col h-[600px] w-full border rounded-xl bg-background overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight leading-none">Persistent Case Memory</h2>
            <p className="text-xs text-muted-foreground mt-1">Ekjut Engine continuous context tracking</p>
          </div>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-4 pt-3 border-b bg-muted/20">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              <span className="hidden sm:inline">Current State</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Activity Log</span>
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="flex items-center gap-2 relative">
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Conflicts</span>
              {activeConflicts.length > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
                  {activeConflicts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden p-4 bg-muted/5">
          <TabsContent value="summary" className="h-full m-0 data-[state=active]:flex flex-col">
            <CaseSummary />
          </TabsContent>
          
          <TabsContent value="history" className="h-full m-0 data-[state=active]:flex flex-col">
            <CaseChangeFeed />
          </TabsContent>

          <TabsContent value="conflicts" className="h-full m-0 data-[state=active]:flex flex-col">
            {activeConflicts.length > 0 ? (
              <div className="space-y-4 overflow-y-auto pr-2 pb-4">
                {activeConflicts.map((conflict) => (
                  <MemoryConflict 
                    key={conflict.id} 
                    conflict={conflict} 
                    onResolve={handleResolveConflict} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <ShieldAlert className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-medium">Memory is Consistent</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  There are currently no contradictions in the established case facts.
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
