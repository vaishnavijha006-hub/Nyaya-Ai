import React from 'react';
import { Mail, Globe, Landmark, ArrowRight } from 'lucide-react';

interface SubmissionOption {
  id: string;
  title: string;
  description: string;
  type: 'portal' | 'email' | 'physical';
  url?: string;
  email?: string;
  address?: string;
}

interface SubmissionOptionsProps {
  options: SubmissionOption[];
  onSelect?: (optionId: string) => void;
}

const typeIcons = {
  portal: <Globe className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  physical: <Landmark className="h-5 w-5" />,
};

export function SubmissionOptions({ options, onSelect }: SubmissionOptionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        Filing Options
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <div
            key={option.id}
            className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
            onClick={() => onSelect?.(option.id)}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {typeIcons[option.type]}
            </div>
            <h4 className="font-medium text-foreground mb-1">{option.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {option.description}
            </p>
            <div className="mt-auto flex items-center text-sm font-medium text-primary">
              Select Option
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
