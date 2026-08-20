import React from 'react';
import { DataExport } from './data-export';
import { DataDeletion } from './data-deletion';
import { DataCorrection } from './data-correction';
import { DataRetentionStatus } from './data-retention-status';
import { PrivacyAccessHistory } from './privacy-access-history';

interface PrivacyCenterProps {
  streamState?: any;
}

export function PrivacyCenter({ streamState = {} }: PrivacyCenterProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataExport exportReadyEvent={streamState.dataExportReady} />
        <DataDeletion deletionCompletedEvent={streamState.dataDeletionCompleted} />
      </div>
      
      <DataCorrection correctionAppliedEvent={streamState.dataCorrectionApplied} />
      <DataRetentionStatus retentionEvent={streamState.dataRetentionRequired} />
      <PrivacyAccessHistory loggedEvent={streamState.privacyAccessLogged} />
    </div>
  );
}
