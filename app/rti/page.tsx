'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Download, Copy, Check, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Reveal } from '@/components/nyaya/reveal';
import { ThinkingPulse } from '@/components/nyaya/loading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const departments = [
  'Municipal Corporation',
  'Public Works Department',
  'Police Department',
  'Revenue Department',
  'Education Department',
  'Health Department',
  'Electricity Board',
  'Other',
];

export default function RTIPage() {
  return (
    <AppShell>
      <RTIGenerator />
    </AppShell>
  );
}

function RTIGenerator() {
  const [form, setForm] = React.useState({
    applicantName: '',
    applicantAddress: '',
    applicantEmail: '',
    applicantPhone: '',
    department: departments[0],
    publicAuthority: '',
    subject: '',
    infoDetails: '',
    periodFrom: '',
    periodTo: '',
    feeMode: 'Court fee stamp of ₹10',
  });
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const generate = () => {
    if (!form.applicantName || !form.infoDetails) {
      toast.error('Please enter your name and the information you need');
      return;
    }
    setGenerating(true);
    setGenerated(null);
    setTimeout(() => {
      setGenerated(buildRTI(form));
      setGenerating(false);
      toast.success('RTI application drafted');
    }, 1600);
  };

  const reset = () => {
    setGenerated(null);
    setForm((f) => ({ ...f, subject: '', infoDetails: '', periodFrom: '', periodTo: '' }));
  };

  const copy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast.success('Copied to clipboard');
  };

  const download = () => {
    if (!generated) return;
    const blob = new Blob([generated], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTI_Application_${form.applicantName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Reveal>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">RTI Generator</h1>
            <p className="text-sm text-muted-foreground">Draft a Right to Information application in seconds.</p>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Reveal>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Application details</CardTitle>
              <CardDescription>Fill in the fields below. Required fields are marked with *.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name *">
                  <Input value={form.applicantName} onChange={update('applicantName')} placeholder="Your name" />
                </Field>
                <Field label="Phone">
                  <Input value={form.applicantPhone} onChange={update('applicantPhone')} placeholder="+91…" />
                </Field>
              </div>
              <Field label="Address">
                <Textarea value={form.applicantAddress} onChange={update('applicantAddress')} placeholder="Your postal address" rows={2} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.applicantEmail} onChange={update('applicantEmail')} placeholder="you@example.com" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Public authority *">
                  <Input value={form.publicAuthority} onChange={update('publicAuthority')} placeholder="e.g. Municipal Corporation of Greater Mumbai" />
                </Field>
                <Field label="Department">
                  <select
                    value={form.department}
                    onChange={update('department')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Subject of the application">
                <Input value={form.subject} onChange={update('subject')} placeholder="Short subject line" />
              </Field>
              <Field label="Information sought *">
                <Textarea
                  value={form.infoDetails}
                  onChange={update('infoDetails')}
                  placeholder="Describe the information you want to request in detail…"
                  rows={4}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Period from">
                  <Input type="date" value={form.periodFrom} onChange={update('periodFrom')} />
                </Field>
                <Field label="Period to">
                  <Input type="date" value={form.periodTo} onChange={update('periodTo')} />
                </Field>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>A fee of ₹10 applies (₹2 for BPL applicants). The authority must respond within 30 days. This draft is a starting point — verify with your local Public Information Officer.</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={generate} disabled={generating} className="flex-1 gap-2">
                  {generating ? <ThinkingPulse className="text-white" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? 'Drafting…' : 'Generate application'}
                </Button>
                <Button variant="outline" onClick={reset} disabled={generating}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* Preview */}
        <Reveal delay={0.1}>
          <Card className="glass-strong sticky top-8 h-fit border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>Your drafted RTI application.</CardDescription>
              </div>
              {generated && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={copy} className="gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={download} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="space-y-3 py-4">
                  <ThinkingPulse />
                </div>
              ) : generated ? (
                <motion.pre
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre-wrap rounded-xl bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground/90"
                >
                  {generated}
                </motion.pre>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Your draft will appear here</p>
                  <p className="mt-1 text-xs text-muted-foreground">Fill in the form and click generate.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function buildRTI(f: typeof RTIPage extends never ? never : any): string {
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  return `To,
The Public Information Officer,
${f.publicAuthority || f.department},
[City, State]

Date: ${date}

Subject: Request for information under the Right to Information Act, 2005${f.subject ? ` — ${f.subject}` : ''}

Sir/Madam,

I, ${f.applicantName}, a citizen of India, hereby request the following information under Section 6(1) of the Right to Information Act, 2005:

${f.infoDetails}

${f.periodFrom || f.periodTo ? `Period of information requested: ${f.periodFrom || '—'} to ${f.periodTo || '—'}` : ''}

I hereby state that the information sought is not falling under any of the exemptions provided in Section 8 and 9 of the RTI Act, 2005. I am enclosing the application fee of ₹10 by way of ${f.feeMode}.

Kindly provide the information within the stipulated period of 30 days as per Section 7(1) of the Act.

Applicant details:
Name: ${f.applicantName}
Address: ${f.applicantAddress || '—'}
Email: ${f.applicantEmail || '—'}
Phone: ${f.applicantPhone || '—'}

Place: __________
Date: ${date}

Yours faithfully,

(${f.applicantName})
`;
}
