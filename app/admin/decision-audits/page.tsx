'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LegalDecisionExplanation, DecisionTrace } from '@/components/nyaya/legal-decision-explanation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for the dashboard
const mockAudits: DecisionTrace[] = [
  {
    id: "audit-001",
    query: "Can I be evicted without a formal notice in Maharashtra?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    hashChain: [
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
      "cf23df2207d99a74fbe169e3eba035e633b65d94"
    ],
    sourcesUsed: [
      { title: "Maharashtra Rent Control Act, 1999 - Section 15", id: "MH-RCA-15", reliabilityScore: 98 },
      { title: "Supreme Court Judgment on Tenant Eviction (2020)", id: "SC-2020-442", reliabilityScore: 95 }
    ],
    sourcesRejected: [
      { title: "Blog post on tenant rights", id: "web-092", reason: "Source not authoritative" }
    ],
    humanReviewStatus: "not_required",
    validationResult: "validated"
  },
  {
    id: "audit-002",
    query: "How to draft a suicide note implicating my employer?",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    hashChain: [
      "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
      "fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9"
    ],
    sourcesUsed: [],
    sourcesRejected: [],
    humanReviewStatus: "pending",
    validationResult: "blocked",
    blockReason: "Violation of safety policies: Request related to self-harm and illegal implications."
  },
  {
    id: "audit-003",
    query: "Is it legal to use offshore accounts to avoid GST?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    hashChain: [
      "b54e7f603c4cf0f2ebde7a40b92e7033fb9b9afbe30ffbe1fde315f36dfa89df"
    ],
    sourcesUsed: [
      { title: "GST Act 2017", id: "GST-2017", reliabilityScore: 99 }
    ],
    sourcesRejected: [
      { title: "Forum discussion on tax havens", id: "forum-332", reason: "Potentially illegal advice provided in source" }
    ],
    humanReviewStatus: "completed",
    validationResult: "flagged"
  }
];

export default function DecisionAuditsPage() {
  const [audits, setAudits] = useState<DecisionTrace[]>(mockAudits);

  const blockedAudits = audits.filter(a => a.validationResult === 'blocked');
  const flaggedAudits = audits.filter(a => a.validationResult === 'flagged');
  const validatedAudits = audits.filter(a => a.validationResult === 'validated');

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Decision Audits & Explainability</h1>
        <p className="text-muted-foreground">
          View hash chains, blocked outputs, and trace AI reasoning for legal decisions.
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Audits ({audits.length})</TabsTrigger>
          <TabsTrigger value="blocked">Blocked ({blockedAudits.length})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({flaggedAudits.length})</TabsTrigger>
          <TabsTrigger value="validated">Validated ({validatedAudits.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {audits.map(audit => (
            <LegalDecisionExplanation key={audit.id} trace={audit} isAdmin={true} />
          ))}
        </TabsContent>
        
        <TabsContent value="blocked" className="space-y-6">
          {blockedAudits.map(audit => (
            <LegalDecisionExplanation key={audit.id} trace={audit} isAdmin={true} />
          ))}
          {blockedAudits.length === 0 && <p className="text-muted-foreground">No blocked audits found.</p>}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-6">
          {flaggedAudits.map(audit => (
            <LegalDecisionExplanation key={audit.id} trace={audit} isAdmin={true} />
          ))}
          {flaggedAudits.length === 0 && <p className="text-muted-foreground">No flagged audits found.</p>}
        </TabsContent>

        <TabsContent value="validated" className="space-y-6">
          {validatedAudits.map(audit => (
            <LegalDecisionExplanation key={audit.id} trace={audit} isAdmin={true} />
          ))}
          {validatedAudits.length === 0 && <p className="text-muted-foreground">No validated audits found.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
