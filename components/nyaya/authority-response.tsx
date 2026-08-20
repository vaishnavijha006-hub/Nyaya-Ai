import React from 'react';
import { MessageSquare, Download, Calendar } from 'lucide-react';

interface AuthorityResponseProps {
  authorityName: string;
  responseDate: string;
  message: string;
  attachments?: { id: string; name: string; url: string }[];
}

export function AuthorityResponse({ authorityName, responseDate, message, attachments }: AuthorityResponseProps) {
  return (
    <div className="relative pl-6 before:absolute before:left-[11px] before:top-8 before:bottom-0 before:w-[2px] before:bg-border last:before:hidden">
      <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 ring-4 ring-background">
        <MessageSquare className="h-3.5 w-3.5 text-primary" />
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold text-foreground">{authorityName}</h4>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(responseDate).toLocaleDateString()}
          </span>
        </div>
        
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {message}
        </p>

        {attachments && attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {attachments.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" />
                {file.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
