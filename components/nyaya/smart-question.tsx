'use client';

import * as React from 'react';
import { Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SmartQuestionProps {
  questionId: string;
  question: string;
  type: 'single_choice' | 'yes_no' | 'text';
  whyAsking?: string;
  options?: string[];
  onSubmit: (answer: string) => void;
  answeredValue?: string;
}

export function SmartQuestion({
  questionId,
  question,
  type,
  whyAsking = 'Helps determine applicable statutory protection and jurisdiction.',
  options,
  onSubmit,
  answeredValue,
}: SmartQuestionProps) {
  const [textAnswer, setTextAnswer] = React.useState('');
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);

  const isAnswered = answeredValue !== undefined;

  const handleSubmit = (val: string) => {
    if (isAnswered) return;
    onSubmit(val);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textAnswer.trim() && !isAnswered) {
      onSubmit(textAnswer.trim());
    }
  };

  const defaultOptions = options || ['Yes', 'No', "I'm not sure"];

  return (
    <div className="my-4 rounded-xl border border-amber-500/30 bg-card shadow-xs overflow-hidden">
      <div className="bg-amber-500/10 px-4 py-3 border-b border-amber-500/20 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
          <HelpCircle className="h-3 w-3" />
          <span>Why Nyaya is asking: {whyAsking}</span>
        </div>
        <h4 className="text-xs font-bold leading-relaxed text-foreground">{question}</h4>
      </div>

      <div className="p-4 space-y-3">
        {isAnswered ? (
          <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400 font-semibold bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Answered: {answeredValue}</span>
          </div>
        ) : (
          <>
            {(type === 'single_choice' || type === 'yes_no') && (
              <div className="flex flex-wrap gap-2">
                {(type === 'yes_no' ? ['Yes', 'No', "I'm not sure"] : defaultOptions).map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      'text-xs font-semibold rounded-xl transition-all border-border hover:border-amber-500/60 hover:bg-amber-500/10',
                      selectedOption === opt && 'border-amber-500 bg-amber-500/20 text-amber-900 dark:text-amber-300'
                    )}
                    onClick={() => {
                      setSelectedOption(opt);
                      handleSubmit(opt);
                    }}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            )}

            {type === 'text' && (
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <Input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1 text-xs h-9"
                />
                <Button type="submit" size="sm" disabled={!textAnswer.trim()} className="bg-slate-900 text-slate-50 dark:bg-amber-500 dark:text-slate-950 rounded-xl h-9 text-xs font-semibold">
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Submit
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
