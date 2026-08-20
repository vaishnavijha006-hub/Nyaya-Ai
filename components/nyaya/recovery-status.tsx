import * as React from 'react';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RecoveryStatusProps {
  status: 'checking' | 'required' | 'in_progress' | 'completed' | 'idle';
  message?: string;
  className?: string;
}

export function RecoveryStatus({ status, message, className }: RecoveryStatusProps) {
  if (status === 'idle') return null;

  return (
    <Card className={cn("border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          {status === 'checking' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
          {status === 'required' && <AlertCircle className="h-5 w-5 text-amber-500" />}
          {status === 'in_progress' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
          {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            System Recovery Status
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {message || getStatusMessage(status)}
        </p>
      </CardContent>
    </Card>
  );
}

function getStatusMessage(status: RecoveryStatusProps['status']) {
  switch (status) {
    case 'checking': return 'Checking system integrity...';
    case 'required': return 'System recovery is required to maintain data integrity.';
    case 'in_progress': return 'Recovery process in progress. Please wait...';
    case 'completed': return 'System recovery completed successfully.';
    default: return '';
  }
}
