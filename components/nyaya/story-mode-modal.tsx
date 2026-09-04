'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Target, Layers, Sparkles, ShieldCheck, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StoryModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryModeModal({ isOpen, onClose }: StoryModeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-amber-500/30 bg-card p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold text-xs">
                Judge & Investor Product Story
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">Nyaya AI Core Innovation</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close story mode"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Story Content */}
          <div className="overflow-y-auto py-6 space-y-6 pr-1">
            {/* The Problem */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                <Target className="h-4 w-4" />
                <span>THE PROBLEM: Massive Court Pendency & Premature Litigation</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                India faces over 50 million pending court cases. Most disputes enter formal court litigation without proper preparation, evidence organization, or exploring available pre-litigation alternatives like settlement, mediation, Lok Adalat, or administrative remedy.
              </p>
            </div>

            {/* The Gap */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
                <Layers className="h-4 w-4" />
                <span>THE GAP: Existing Legal-Tech Tools Fall Short</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Most legal-tech software focuses on isolated tasks: generic legal chatbot Q&A, simple document drafting, or advocate discovery. Citizens remain lost in technical backend states, unable to navigate the end-to-end legal lifecycle.
              </p>
            </div>

            {/* The Nyaya Approach */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>THE NYAYA APPROACH: End-to-End Guided Resolution Journey</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Nyaya AI helps citizens progress through a structured 7-stage pipeline:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {['1. Problem Intake', '2. Fact Verification', '3. Evidence Audit', '4. Legal Analysis', '5. Resolution Path', '6. Action Plan', '7. Case Package'].map((stage, idx) => (
                  <div key={idx} className="rounded-lg border border-emerald-500/30 bg-card p-2 text-[11px] font-semibold text-center text-foreground shadow-2xs">
                    {stage}
                  </div>
                ))}
              </div>
            </div>

            {/* The Differentiator */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>THE NYAYA DIFFERENTIATOR: Unifying 9 Systems Into 1 Experience</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Conversational Intake</span>
                </div>
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Document Evidence Audit</span>
                </div>
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Layered Analysis</span>
                </div>
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Pre-Litigation Settlement</span>
                </div>
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Mediation &amp; ADR Routing</span>
                </div>
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>DLSA Legal Aid Access</span>
                </div>
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Judge-Ready Case Package</span>
                </div>
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Delay Intelligence</span>
                </div>
                <div className="flex items-center gap-2 bg-card p-2.5 rounded-lg border border-border/60">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Anonymized Pattern Engine</span>
                </div>
              </div>
            </div>

            {/* Legal Safety & Human Advocacy */}
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-slate-800 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Human-in-the-Loop Philosophy:</strong> Nyaya AI empowers citizens with structured information and readiness scoring while explicitly mandating advocate review before formal court reliance.
              </p>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close Story
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold text-xs gap-1.5"
            >
              <a href="/demo" onClick={onClose}>
                <span>Launch Interactive Demo Mode</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
