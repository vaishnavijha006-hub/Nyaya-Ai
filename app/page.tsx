'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Scale, FileText, Search, ShieldCheck,
  Zap, MessageSquare, Mic, Paperclip, Quote, CheckCircle2, Star,
  Building2, Banknote, Briefcase, Users, ShoppingBag, FolderSearch, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/nyaya/reveal';
import { AIResponseCard } from '@/components/nyaya/ai-response-card';
import { TypingDots, ThinkingPulse } from '@/components/nyaya/loading';
import { getLegalAnswer, suggestedPrompts, type LegalAnswer } from '@/lib/legal-engine';
import { SiteHeader } from '@/components/nyaya/site-header';
import { SiteFooter } from '@/components/nyaya/site-footer';
import { NyayaPath } from '@/components/nyaya/nyaya-path';

const categoryShortcuts = [
  { icon: Building2, title: 'Property & Rent', prompt: 'My landlord locked me out without notice and withheld my deposit.' },
  { icon: Banknote, title: 'Money & Cheques', prompt: 'A client bounced a cheque of ₹50,000 for work delivered 3 months ago.' },
  { icon: Briefcase, title: 'Employment', prompt: 'My employer terminated me without paying notice pay or gratuity.' },
  { icon: Users, title: 'Family', prompt: 'Need guidance on maintenance claims and child custody legal procedure.' },
  { icon: ShoppingBag, title: 'Consumer', prompt: 'E-commerce platform delivered a damaged phone and refuses refund.' },
  { icon: FileText, title: 'Documents', prompt: 'Draft a formal Legal Notice or RTI application under Indian law.' },
  { icon: FolderSearch, title: 'Existing Case', prompt: 'My court case has been delayed over 2 years across 12 hearings.' },
  { icon: AlertTriangle, title: 'Emergency', prompt: 'Received urgent illegal eviction notice or police summons.' },
];

const features = [
  { icon: Scale, title: 'Structured Legal Pathways', desc: 'Evaluates your dispute against Pre-Litigation ADR, DLSA Legal Aid, Collective Patterns, or Litigation.' },
  { icon: Search, title: 'Verifiable Citations', desc: 'Every response is backed by exact statutes, acts, and supreme court / high court judgments.' },
  { icon: FileText, title: 'Court-Ready Documentation', desc: 'Generates RTI applications, Legal Notices, Affidavits, and Judge-Ready Case Summaries.' },
  { icon: ShieldCheck, title: 'Private & Encrypted', desc: 'Strict confidentiality. Your case facts and documents are encrypted and never used for public training.' },
  { icon: Users, title: 'Pattern Detection', desc: 'Identifies recurring systemic issues across multiple complaints to support collective action.' },
  { icon: Mic, title: 'Multi-lingual Voice & Files', desc: 'Describe your case in Indian languages or upload documents — Nyaya extracts and verifies facts.' },
];

const testimonials = [
  { name: 'Adv. Priya Menon', role: 'High Court Practitioner', quote: 'Nyaya AI organizes case facts and citations systematically. It gives citizens clear direction before they step into court.', rating: 5 },
  { name: 'Rahul Verma', role: 'Small Business Owner', quote: 'Drafting an RTI application used to take days. With Nyaya, I understood my exact legal rights in 2 minutes.', rating: 5 },
  { name: 'Sneha Iyer', role: 'Legal Aid Volunteer', quote: 'For pro-bono cases, Nyaya helps us quickly triage disputes into mediation, legal aid, or formal filing.', rating: 5 },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-background">
      <SiteHeader />
      <Hero />
      <JourneyPhilosophy />
      <Features />
      <Demo />
      <Testimonials />
      <CTA />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  const [problemText, setProblemText] = React.useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim()) return;
    const encoded = encodeURIComponent(problemText.trim());
    router.push(`/chat?q=${encoded}`);
  };

  const handleShortcutClick = (prompt: string) => {
    setProblemText(prompt);
  };

  return (
    <section className="relative flex min-h-[90vh] flex-col justify-center pt-24 pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <Badge variant="outline" className="mb-6 gap-1.5 rounded-full border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-400">
              <Scale className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Intelligent Legal Journey Platform
            </Badge>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl lg:text-6xl">
              Your Legal Problem.
              <br />
              <span className="text-amber-800 dark:text-amber-400 font-extrabold">Your Next Step.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
              Describe what happened in your own words. Nyaya AI will help you understand the issue and identify the appropriate legal pathway.
            </p>
          </Reveal>

          {/* Conversational Case Intake Box */}
          <Reveal delay={0.15}>
            <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-3xl">
              <div className="relative rounded-2xl border border-border/90 bg-card p-3 shadow-md transition-all focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/20">
                <textarea
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  rows={3}
                  className="w-full resize-none bg-transparent p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                  placeholder="My landlord locked me out without notice..."
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5 px-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                    <span>Confidential & Free Initial Assessment</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={!problemText.trim()}
                    className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-semibold px-5 rounded-xl shadow-sm"
                  >
                    <span>Analyze Problem</span>
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </Reveal>

          {/* Category Shortcuts */}
          <Reveal delay={0.2}>
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Or select a dispute category
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
                {categoryShortcuts.map((c) => (
                  <button
                    key={c.title}
                    type="button"
                    onClick={() => handleShortcutClick(c.prompt)}
                    className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:border-amber-500/50 hover:bg-muted hover:text-foreground"
                  >
                    <c.icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{c.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function JourneyPhilosophy() {
  return (
    <section className="relative border-y border-border/80 bg-muted/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            The Nyaya AI Resolution Framework
          </h2>
          <p className="text-lg font-bold text-foreground mt-1">
            Progressive Guidance from Problem to Resolution
          </p>
        </div>

        {/* Embedded Signature NyayaPath Indicator */}
        <div className="mx-auto max-w-4xl">
          <NyayaPath currentStepIndex={3} variant="compact" />
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 border-amber-500/30 text-amber-800 dark:text-amber-400">
            Platform Architecture
          </Badge>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Designed for Citizens, Advocates, and Judges
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Combining verified Indian legal sources with structured pathway intelligence.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="legal-card h-full p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const [query, setQuery] = React.useState(suggestedPrompts[0]);
  const [stage, setStage] = React.useState<'idle' | 'thinking' | 'done'>('idle');
  const [answer, setAnswer] = React.useState<LegalAnswer | null>(null);

  const run = React.useCallback(async () => {
    if (!query.trim()) return;
    setStage('thinking');
    setAnswer(null);
    const result = await getLegalAnswer(query);
    setAnswer(result);
    setStage('done');
  }, [query]);

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="demo" className="relative py-16 border-t border-border/60 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Verifiable Legal Citation Preview
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            See how Nyaya AI backs every legal opinion with exact acts and case law.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-8 max-w-3xl">
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedPrompts.slice(0, 3).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setQuery(p);
                    setStage('idle');
                    setAnswer(null);
                    setTimeout(run, 50);
                  }}
                  className="rounded-lg border border-border/80 bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:border-amber-500/50 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run()}
                className="flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground"
                placeholder="Ask a legal question…"
              />
              <Button size="sm" onClick={run} className="h-8 rounded-lg bg-slate-900 text-slate-50 dark:bg-amber-500 dark:text-slate-950 font-medium text-xs">
                Analyze
              </Button>
            </div>

            <div className="mt-4 min-h-[180px]">
              {stage === 'thinking' && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <ThinkingPulse />
                </div>
              )}
              {stage === 'done' && answer && (
                <AIResponseCard
                  response={{ id: 'demo', content: answer.content, citations: answer.citations }}
                />
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Trusted by Legal Practitioners & Citizens
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div className="legal-card h-full p-5 flex flex-col justify-between">
                <div>
                  <Quote className="h-6 w-6 text-amber-600/50" />
                  <p className="mt-3 text-xs leading-relaxed text-foreground/90">
                    "{t.quote}"
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{t.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative py-16 border-t border-border/80 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-12 shadow-sm">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Start Your Legal Resolution Journey Today
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-xs text-muted-foreground leading-relaxed">
              Understand your rights, organize case facts, and receive guided pathway recommendations — confidential and free.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold px-6 rounded-xl">
                <Link href="/chat">
                  Start Legal Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl px-6">
                <Link href="/legal-notice">Draft a Legal Notice</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
