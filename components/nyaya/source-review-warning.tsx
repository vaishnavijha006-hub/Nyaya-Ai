import { AlertTriangle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SourceReviewWarningProps {
  sourceTitle: string;
  issueDescription: string;
  onReviewClick?: () => void;
}

export function SourceReviewWarning({ sourceTitle, issueDescription, onReviewClick }: SourceReviewWarningProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-xl border border-orange-200 bg-orange-50/50 shadow-sm">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-orange-900">Source Flagged for Review</h4>
          <p className="text-sm text-orange-800 mt-1 leading-relaxed">
            <span className="font-medium">{sourceTitle}</span> - {issueDescription}
          </p>
        </div>
      </div>
      {onReviewClick && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReviewClick}
          className="shrink-0 bg-white border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
        >
          <Flag className="h-3.5 w-3.5 mr-1.5" />
          Review Source
        </Button>
      )}
    </div>
  );
}
