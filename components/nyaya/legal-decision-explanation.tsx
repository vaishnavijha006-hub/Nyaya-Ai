'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, ShieldCheck, FileSearch, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export interface DecisionTrace {
  id: string;
  query: string;
  timestamp: string;
  hashChain: string[];
  sourcesUsed: { title: string; id: string; reliabilityScore: number }[];
  sourcesRejected: { title: string; id: string; reason: string }[];
  humanReviewStatus: 'pending' | 'completed' | 'not_required';
  validationResult: 'validated' | 'blocked' | 'flagged';
  blockReason?: string;
}

interface LegalDecisionExplanationProps {
  trace: DecisionTrace;
  isAdmin?: boolean;
}

export function LegalDecisionExplanation({ trace, isAdmin = false }: LegalDecisionExplanationProps) {
  const getValidationIcon = () => {
    switch (trace.validationResult) {
      case 'validated': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'blocked': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'flagged': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getValidationBadge = () => {
    switch (trace.validationResult) {
      case 'validated': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Validated</Badge>;
      case 'blocked': return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Blocked</Badge>;
      case 'flagged': return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Flagged</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getValidationIcon()}
            <CardTitle className="text-lg">Legal Decision Audit Trace</CardTitle>
          </div>
          {getValidationBadge()}
        </div>
        <CardDescription>
          ID: {trace.id} | Date: {new Date(trace.timestamp).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {trace.validationResult === 'blocked' && trace.blockReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <p><strong>Blocked:</strong> {trace.blockReason}</p>
          </div>
        )}

        <div className="text-sm">
          <strong>Query:</strong> <span className="text-muted-foreground">{trace.query}</span>
        </div>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="sources-used">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Sources Used ({trace.sourcesUsed.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {trace.sourcesUsed.length > 0 ? (
                <ul className="space-y-2">
                  {trace.sourcesUsed.map((source, i) => (
                    <li key={i} className="text-sm border-l-2 border-green-200 pl-3">
                      <div className="font-medium">{source.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>ID: {source.id}</span>
                        <span>Reliability: {source.reliabilityScore}/100</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No sources used.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sources-rejected">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Sources Rejected ({trace.sourcesRejected.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {trace.sourcesRejected.length > 0 ? (
                <ul className="space-y-2">
                  {trace.sourcesRejected.map((source, i) => (
                    <li key={i} className="text-sm border-l-2 border-red-200 pl-3">
                      <div className="font-medium">{source.title}</div>
                      <div className="text-xs text-muted-foreground">ID: {source.id}</div>
                      <div className="text-xs text-red-600 mt-1">Reason: {source.reason}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No sources rejected.</p>
              )}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="human-review">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-blue-500" />
                Human Review Status
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-sm">
                Status: 
                <Badge variant="secondary" className="ml-2">
                  {trace.humanReviewStatus.replace('_', ' ')}
                </Badge>
              </div>
            </AccordionContent>
          </AccordionItem>

          {isAdmin && trace.hashChain && trace.hashChain.length > 0 && (
            <AccordionItem value="hash-chain">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  Hash Chain (Admin Only)
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="bg-slate-950 text-slate-300 p-3 rounded-md text-xs font-mono overflow-x-auto space-y-1">
                  {trace.hashChain.map((hash, i) => (
                    <div key={i}>{hash}</div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
