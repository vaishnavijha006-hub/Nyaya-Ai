import * as React from 'react';
import { LegalAidWorkspace } from '@/components/nyaya/legal-aid-workspace';

export default async function LegalAidPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <LegalAidWorkspace caseId={caseId} />
    </div>
  );
}
