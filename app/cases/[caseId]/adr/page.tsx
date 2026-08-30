import * as React from 'react';
import { ADRWorkspace } from '@/components/nyaya/adr/adr-workspace';

export default async function ADRPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ADRWorkspace caseId={caseId} />
    </div>
  );
}
