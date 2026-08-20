import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface DataExportProps {
  exportReadyEvent?: any;
}

export function DataExport({ exportReadyEvent }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [displayEvent, setDisplayEvent] = useState<any>(null);

  // Apply new jitter mechanics to delay UNITE SSE cluster events
  useEffect(() => {
    if (!exportReadyEvent) return;
    
    const jitterMs = Math.random() * 500 + 200; // 200-700ms jitter
    const timer = setTimeout(() => {
      setDisplayEvent(exportReadyEvent);
    }, jitterMs);
    
    return () => clearTimeout(timer);
  }, [exportReadyEvent]);

  const handleExport = () => {
    setIsExporting(true);
    // Depends on SSE cluster events from backend
  };

  const status = displayEvent?.status?.toUpperCase();
  const isReady = status === 'READY' || (!status && !!displayEvent && displayEvent.status !== 'PARTIAL_FAILURE' && displayEvent.status !== 'FAILED');
  const isPartial = status === 'PARTIAL_FAILURE';
  const isQueued = status === 'QUEUED';
  const isProcessing = status === 'PROCESSING';

  return (
    <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-lg">Data Export</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Download a complete copy of your personal data, including case summaries, submitted documents, and interaction history.
      </p>
      
      {isReady ? (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Your data export is ready</span>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
            Download ZIP
          </button>
        </div>
      ) : isPartial ? (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
          <p className="text-sm font-medium">Export completed with warnings.</p>
          <p className="text-xs">{displayEvent.message || 'Some records were not exported due to system errors or restrictions.'}</p>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors mt-2">
            Download Partial ZIP
          </button>
        </div>
      ) : isProcessing ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Processing Export...</span>
            <span className="text-xs opacity-80">Collating your case files and documents</span>
          </div>
        </div>
      ) : isQueued ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-lg flex items-center gap-3">
          <Clock className="w-5 h-5 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Export Queued</span>
            <span className="text-xs opacity-80">Your request is in line to be processed</span>
          </div>
        </div>
      ) : (
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Request Sent (Waiting for Backend)...
            </>
          ) : (
            'Request Data Export'
          )}
        </button>
      )}
    </div>
  );
}
