import React from 'react';
import { Metadata } from 'next';
import { AppShell } from '@/components/nyaya/app-shell';
import { CollectiveActionCenter } from '@/components/nyaya/collective-action-center';

export const metadata: Metadata = {
  title: 'Collective Actions | Nyaya AI',
  description: 'Join collective legal actions to strengthen your claim.',
};

export default function CollectiveActionsPage() {
  return (
    <AppShell>
      <div className="container max-w-4xl py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collective Action Center</h1>
          <p className="text-muted-foreground mt-2">
            Pool your evidence and resources with others facing similar legal issues.
          </p>
        </div>
        
        <CollectiveActionCenter 
          data={{}} 
          onJoin={() => {
            // For now, redirect to a mock action ID
            if (typeof window !== 'undefined') {
              window.location.href = '/collective-actions/1';
            }
          }} 
        />
      </div>
    </AppShell>
  );
}
