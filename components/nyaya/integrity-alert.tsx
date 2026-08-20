import * as React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface IntegrityAlertProps {
  type: 'case_warning' | 'workflow_failure';
  message?: string;
  className?: string;
}

export function IntegrityAlert({ type, message, className }: IntegrityAlertProps) {
  const isFailure = type === 'workflow_failure';
  
  return (
    <Alert 
      variant={isFailure ? "destructive" : "default"} 
      className={cn(
        isFailure 
          ? "border-red-500 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-200" 
          : "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200",
        className
      )}
    >
      {isFailure ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      <AlertTitle>{isFailure ? 'Workflow Integrity Failure' : 'Integrity Warning'}</AlertTitle>
      <AlertDescription className="mt-1">
        {message || (isFailure 
          ? 'A critical failure has occurred in the workflow. The system has automatically halted the operation to prevent data corruption.' 
          : 'We detected a potential integrity issue with your case data. The system is taking preventive measures.')}
      </AlertDescription>
    </Alert>
  );
}
