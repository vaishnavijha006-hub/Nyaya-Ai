'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SmartQuestionProps {
  questionId: string;
  question: string;
  type: 'single_choice' | 'yes_no' | 'text';
  options?: string[];
  onSubmit: (answer: string) => void;
  answeredValue?: string;
}

export function SmartQuestion({ questionId, question, type, options, onSubmit, answeredValue }: SmartQuestionProps) {
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-4 rounded-xl border border-border bg-card shadow-sm overflow-hidden"
    >
      <div className="bg-muted/30 px-4 py-3 border-b border-border/50">
        <h4 className="text-sm font-medium leading-relaxed">{question}</h4>
      </div>

      <div className="p-4">
        {isAnswered ? (
          <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 p-3 rounded-lg border border-primary/20">
            <CheckCircle2 className="h-4 w-4" />
            <span>Answered: {answeredValue}</span>
          </div>
        ) : (
          <>
            {(type === 'single_choice' && options) && (
              <div className="grid gap-2">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedOption(opt);
                      handleSubmit(opt);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full text-left p-3 rounded-lg border transition-all text-sm",
                      selectedOption === opt 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    {selectedOption === opt ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {type === 'yes_no' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border hover:border-primary hover:bg-primary/5 hover:text-primary"
                  onClick={() => handleSubmit('Yes')}
                >
                  Yes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-border hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => handleSubmit('No')}
                >
                  No
                </Button>
              </div>
            )}

            {type === 'text' && (
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <Input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!textAnswer.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
