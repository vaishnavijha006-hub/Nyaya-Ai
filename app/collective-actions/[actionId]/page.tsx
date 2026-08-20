'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/nyaya/app-shell';
import { CollectiveReadiness } from '@/components/nyaya/collective-readiness';
import { CollectiveConsent } from '@/components/nyaya/collective-consent';
import { RepresentativeMatches } from '@/components/nyaya/representative-matches';
import { CollectiveDocumentBuilder } from '@/components/nyaya/collective-document-builder';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CollectiveActionDetail({ params }: { params: { actionId: string } }) {
  const [hasConsented, setHasConsented] = useState(false);

  return (
    <AppShell>
      <div className="container max-w-4xl py-8 space-y-8">
        
        <div>
          <Link href="/collective-actions" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Actions
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Action: Data Breach Privacy Violation</h1>
          <p className="text-muted-foreground mt-2">
            Join 124 other individuals in pursuing a collective claim for the recent data breach.
          </p>
        </div>

        {!hasConsented ? (
          <div className="flex justify-center">
            <CollectiveConsent 
              data={{}} 
              onAccept={() => setHasConsented(true)}
              onDecline={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/collective-actions';
                }
              }}
            />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CollectiveReadiness data={{}} />
              <RepresentativeMatches 
                matches={[]} 
                onSelect={(id) => console.log('Selected rep:', id)} 
              />
            </div>
            
            <CollectiveDocumentBuilder 
              draft={{}} 
              onApprove={() => console.log('Draft approved')} 
            />
          </div>
        )}

      </div>
    </AppShell>
  );
}
