import * as React from 'react';
import { CasePackageWorkspace } from '@/components/nyaya/case-package/case-package-workspace';

export default async function CasePackagePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <CasePackageWorkspace caseId={caseId} />
    </div>
  );
}
