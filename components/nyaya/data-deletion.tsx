import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface DataDeletionProps {
  deletionCompletedEvent?: any;
}

export function DataDeletion({ deletionCompletedEvent }: DataDeletionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(!!deletionCompletedEvent);

  const handleDelete = () => {
    const confirm = window.confirm("Are you sure you want to permanently delete this data? This action cannot be undone.");
    if (confirm) {
      setIsDeleting(true);
      // Removed local setTimeout simulation; now depends entirely on deletionCompletedEvent via props.
    }
  };

  const isCompleted = !!deletionCompletedEvent;
  const isPartial = deletionCompletedEvent?.status === 'PARTIAL_FAILURE' || deletionCompletedEvent?.status === 'RETAINED_FOR_COMPLIANCE';
  const isFailed = deletionCompletedEvent?.status === 'FAILED' || deletionCompletedEvent?.status === 'RECOVERY_REQUIRED';

  return (
    <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm border-red-100 dark:border-red-900/30">
      <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
        <Trash2 className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Data Deletion</h3>
      </div>
      
      {isCompleted ? (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${isPartial ? 'bg-yellow-50 text-yellow-700' : isFailed ? 'bg-red-50 text-red-700' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
          {isPartial ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="text-sm">
            {deletionCompletedEvent.message || (isPartial ? 'Deletion partially completed due to legal compliance.' : isFailed ? 'Deletion failed.' : 'Your data deletion request has been processed successfully.')}
          </span>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Request the permanent deletion of your personal information from our active systems. 
            Note that some data may be retained for legal compliance purposes.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-500 p-3 rounded-lg flex items-start gap-2 mb-4 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Once deleted, you will lose access to your case history and personalized recommendations.</p>
          </div>
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {isDeleting ? 'Request Sent (Waiting for Backend)...' : 'Request Deletion'}
          </button>
        </>
      )}
    </div>
  );
}
