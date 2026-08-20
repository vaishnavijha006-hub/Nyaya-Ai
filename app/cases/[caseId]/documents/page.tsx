"use client"

import * as React from "react"
import { DocumentVault, VaultDocument } from "@/components/nyaya/document-vault"
import { DocumentDetail } from "@/components/nyaya/document-detail"
import { EvidenceGap } from "@/components/nyaya/evidence-gap"
import { DocumentConflict } from "@/components/nyaya/document-conflict"
import { SiteHeader } from "@/components/nyaya/site-header"
import { SiteFooter } from "@/components/nyaya/site-footer"
import { ArrowLeft, Scale } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CaseDocumentsPage({ params }: { params: { caseId: string } }) {
  const [selectedDoc, setSelectedDoc] = React.useState<VaultDocument | null>(null)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/10">
        <div className="container py-8 max-w-6xl">
          <div className="mb-6">
            <Link href={`/cases/${params.caseId}`}>
              <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Case Command Center
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Case Evidence Hub</h1>
                <p className="text-muted-foreground mt-1">
                  Case ID: {params.caseId} • Analyze and align your documents with case memory
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Vault & Gaps */}
            <div className="lg:col-span-2 space-y-6">
              <EvidenceGap />
              <DocumentConflict />
              <DocumentVault onViewDocument={setSelectedDoc} />
            </div>

            {/* Right Column - Document Intelligence */}
            <div className="space-y-6">
              <div className="sticky top-6">
                <h3 className="text-lg font-semibold mb-4">Document Intelligence</h3>
                {selectedDoc ? (
                  <DocumentDetail document={selectedDoc} />
                ) : (
                  <div className="h-[400px] rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-6 bg-muted/20">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Scale className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Select a Document</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click on any document in the vault to view AI-extracted entities, summary, and verification status.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
