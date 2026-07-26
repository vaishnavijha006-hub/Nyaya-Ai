'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Sparkles, Scale, FileText, Search, ShieldCheck,
  Zap, MessageSquare, Mic, Paperclip, Quote, CheckCircle2, Star,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/nyaya/reveal';
import { AIResponseCard } from '@/components/nyaya/ai-response-card';
import { TypingDots, ThinkingPulse } from '@/components/nyaya/loading';
import { getLegalAnswer, suggestedPrompts } from '@/lib/legal-engine';
import { SiteHeader } from '@/components/nyaya/site-header';
import { SiteFooter } from '@/components/nyaya/site-footer';

const features = [
  { icon: Search, title: 'Cited legal answers', desc: 'Every response is backed by statutes, case law, and regulations — with traceable sources.' },
  { icon: FileText, title: 'Document drafting', desc: 'Generate RTI applications, legal notices, and affidavits in a jurisdiction-ready format.' },
  { icon: ShieldCheck, title: 'Private & secure', desc: 'End-to-end encrypted conversations. Your data is never used to train models.' },
  { icon: Zap, title: 'Instant research', desc: 'Summarise judgements and traverse related case law in seconds, not hours.' },
  { icon: MessageSquare, title: 'Plain-language explanations', desc: 'Complex legal jargon translated into language anyone can act on.' },
  { icon: Mic, title: 'Voice & file input', desc: 'Ask by voice or upload case files — Nyaya reads and reasons over them.' },
];

const testimonials = [
  { name: 'Adv. Priya Menon', role: 'High Court, Mumbai', quote: 'Nyaya AI cut my research time from hours to minutes. The citations are accurate and verifiable — it is now part of my daily workflow.', rating: 5 },
  { name: 'Rahul Verma', role: 'Founder, Verma & Co.', quote: 'Drafting RTI applications used to be tedious. With Nyaya, what took an hour now takes two minutes, and the output is court-ready.', rating: 5 },
  { name: 'Sneha Iyer', role: 'Legal Aid Clinic, Pune', quote: 'For our pro-bono clients, Nyaya is a lifeline. Plain-language answers help people understand their rights without intimidation.', rating: 5 },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <SiteHeader />
      <Hero />
      <Features />
      <Demo />
      <Testimonials />
      <CTA />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen items-center pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute right-1/4 top-1/3 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] opacity-50" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Badge variant="outline" className="mb-6 gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-primary">
              <Sparkles className="h-3 w-3" />
              Now in beta — cited answers to Indian law
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              The AI legal assistant
              <br />
              <span className="text-gradient">for every Indian.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Understand your rights, draft RTI applications and legal notices, and get cited answers to legal questions — in seconds, not weeks.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="group h-12 rounded-xl px-6 glow">
                <Link href="/auth">
                  Start chatting free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
                <Link href="/rti">Try the RTI Generator</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              {['No credit card', 'Cited sources', 'Court-ready drafts'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to navigate the law
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for citizens, advocates, and legal-aid clinics — Nyaya combines AI with verified legal sources.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group glass h-full rounded-2xl p-6 transition-shadow hover:glow"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary transition-transform group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
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
  const [answer, setAnswer] = React.useState<ReturnType<typeof getLegalAnswer> | null>(null);

  const run = React.useCallback(() => {
    if (!query.trim()) return;
    setStage('thinking');
    setAnswer(null);
    setTimeout(() => {
      setAnswer(getLegalAnswer(query));
      setStage('done');
    }, 1500);
  }, [query]);

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="demo" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Live demo</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            See Nyaya AI in action
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pick a question and watch Nyaya research, reason, and cite — in real time.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl">
          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.slice(0, 4).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setQuery(p);
                    setStage('idle');
                    setAnswer(null);
                    setTimeout(run, 50);
                  }}
                  className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-background/60 p-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run()}
                className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Ask a legal question…"
              />
              <Button size="sm" onClick={run} className="h-9 rounded-xl">
                Ask
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="mt-6 min-h-[220px]">
              {stage === 'thinking' && (
                <div className="glass rounded-2xl p-5">
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
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Testimonials</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by legal professionals
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <motion.figure
                whileHover={{ y: -4 }}
                className="glass h-full rounded-2xl p-6"
              >
                <Quote className="h-7 w-7 text-primary/40" />
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                  "{t.quote}"
                </blockquote>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                    {t.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <figcaption className="text-sm font-semibold">{t.name}</figcaption>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </motion.figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Your rights, answered.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of Indians using Nyaya AI to understand the law and act with confidence.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl px-6 glow">
                <Link href="/auth">
                  Get started — it is free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-6">
                <Link href="/legal-notice">Draft a legal notice</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
