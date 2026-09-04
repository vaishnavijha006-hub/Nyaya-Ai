'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Scale, FileText, Compass, CheckSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: '1. Tell Nyaya what happened',
    description: 'Describe your legal dispute in simple, everyday language. Use text or voice in your preferred language.',
    tip: 'No complex legal terms needed — just tell the story from your perspective.',
  },
  {
    icon: Scale,
    title: '2. Fact Extraction & Clarification',
    description: 'Nyaya AI analyzes your description, extracts key chronological facts, and asks intelligent follow-up questions if details are missing.',
    tip: 'Helps transform raw stories into structured facts for legal review.',
  },
  {
    icon: FileText,
    title: '3. Upload Relevant Evidence',
    description: 'Upload contracts, rent agreements, receipts, or chat screenshots. Nyaya verifies documents and flags missing evidence.',
    tip: 'Nyaya never uses private documents for public AI model training.',
  },
  {
    icon: Scale,
    title: '4. Layered Legal Analysis',
    description: 'Receive preliminary legal analysis with plain-language explanations backed by exact statutory acts and court precedents.',
    tip: 'Understand your rights without getting overwhelmed by legalese.',
  },
  {
    icon: Compass,
    title: '5. Explore Resolution Pathways',
    description: 'Evaluate options like Pre-Litigation Settlement, Mediation, DLSA Legal Aid, or Formal Litigation before stepping into court.',
    tip: 'Designed to help avoid unnecessary delay and costly court filings.',
  },
  {
    icon: CheckSquare,
    title: '6. Follow Your Custom Action Plan',
    description: 'Get step-by-step guidance on what to do next, with downloadable judge-ready case packages and templates.',
    tip: 'Always review with a qualified advocate before filing formal claims.',
  },
];

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nyaya_onboarded_v1', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  const stepData = steps[currentStep];
  const StepIcon = stepData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleComplete}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-amber-500/20 bg-card p-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold text-xs">
                Welcome to Nyaya AI
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">Step {currentStep + 1} of {steps.length}</span>
            </div>
            <button
              onClick={handleComplete}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Safety Disclaimer Banner */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-slate-700 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="leading-snug">
              <strong className="font-semibold text-foreground">Legal Safety Note:</strong> Nyaya AI provides informational and organizational assistance. It does not replace a qualified advocate or court.
            </p>
          </div>

          {/* Step Content */}
          <div className="py-6 min-h-[200px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <StepIcon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {stepData.title}
                </h3>
              </div>

              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {stepData.description}
              </p>

              <div className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{stepData.tip}</span>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="mt-6 flex justify-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep ? 'w-6 bg-amber-500' : 'w-2 bg-border hover:bg-muted-foreground'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Button>

            <button
              onClick={handleComplete}
              className="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
            >
              Skip Onboarding
            </button>

            {currentStep < steps.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="gap-1 bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-xs font-semibold"
              >
                Next Step
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleComplete}
                className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
              >
                Get Started
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
