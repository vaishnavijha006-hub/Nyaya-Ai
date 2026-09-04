import * as React from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/nyaya/site-header"
import { SiteFooter } from "@/components/nyaya/site-footer"
import { ActionPlanSection } from "@/components/nyaya/case-dashboard/action-plan-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, FileText, ArrowRight, ShieldCheck, Sparkles, FolderOpen, Users } from "lucide-react"

export default function ActionPlansPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 bg-muted/20 py-10">
        <div className="container max-w-5xl space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs font-semibold">
                  Citizen Legal Roadmap
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  Pre-Litigation Resolution
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Structured Action Plans</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Step-by-step resolution pathways formatted with WHAT • WHY • HOW for your active legal matters.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5">
                <Link href="/chat">
                  <Sparkles className="h-4 w-4" />
                  <span>Start New Action Plan</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-border/60 bg-card hover:bg-accent/40 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500" />
                  1. Evidence Audit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Upload and verify contracts, receipts, and communication logs.</p>
                <Button asChild variant="outline" size="sm" className="w-full text-xs font-medium">
                  <Link href="/documents">Open Evidence Vault →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card hover:bg-accent/40 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  2. Statutory Demand Notice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Draft formal 15-day pre-litigation legal notice to opposite party.</p>
                <Button asChild variant="outline" size="sm" className="w-full text-xs font-medium">
                  <Link href="/legal-notice">Draft Legal Notice →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card hover:bg-accent/40 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  3. Cluster Case Filing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Explore group petitions and collective actions with empanelled advocates.</p>
                <Button asChild variant="outline" size="sm" className="w-full text-xs font-medium">
                  <Link href="/cluster-cases">View Cluster Cases →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Case Action Plan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-amber-500" />
                Active Action Plan: Tenant Deposit Recovery
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/cases/case-1">View Full Case Dashboard →</Link>
              </Button>
            </div>

            <ActionPlanSection caseId="case-1" />
          </div>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
