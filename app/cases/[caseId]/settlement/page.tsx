import * as React from 'react';
import { SettlementWorkspace } from '@/components/nyaya/settlement/settlement-workspace';

export default async function SettlementPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <SettlementWorkspace caseId={caseId} />
    </div>
  );
}
