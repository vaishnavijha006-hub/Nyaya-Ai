'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Sparkles, Download, Copy, Check, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Reveal } from '@/components/nyaya/reveal';
import { ThinkingPulse } from '@/components/nyaya/loading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const noticeTypes = [
  'Recovery of dues',
  'Cheque bounce (Section 138)',
  'Property dispute',
  'Deficient service',
  'Defective goods',
  'Non-payment of salary',
  'Eviction / tenancy',
  'Other',
];

export default function LegalNoticePage() {
  return (
    <AppShell>
      <LegalNoticeGenerator />
    </AppShell>
  );
}

function LegalNoticeGenerator() {
  const [form, setForm] = React.useState({
    senderName: '',
    senderAddress: '',
    senderEmail: '',
    senderPhone: '',
    recipientName: '',
    recipientAddress: '',
    noticeType: noticeTypes[0],
    subject: '',
    facts: '',
    demand: '',
    reliefAmount: '',
    responseDays: '15',
  });
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const generate = () => {
    if (!form.senderName || !form.recipientName || !form.facts) {
      toast.error('Please fill in the sender, recipient, and the facts of the matter');
      return;
    }
    setGenerating(true);
    setGenerated(null);
    setTimeout(() => {
      setGenerated(buildNotice(form));
      setGenerating(false);
      toast.success('Legal notice drafted');
    }, 1600);
  };

  const reset = () => {
    setGenerated(null);
    setForm((f) => ({ ...f, subject: '', facts: '', demand: '', reliefAmount: '' }));
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
    a.download = `Legal_Notice_${form.recipientName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Reveal>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Legal Notice Generator</h1>
            <p className="text-sm text-muted-foreground">Draft a formal legal notice before initiating litigation.</p>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Notice details</CardTitle>
              <CardDescription>Provide the facts and the relief you seek. Required fields are marked *.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name *">
                  <Input value={form.senderName} onChange={update('senderName')} placeholder="Sender name" />
                </Field>
                <Field label="Your phone">
                  <Input value={form.senderPhone} onChange={update('senderPhone')} placeholder="+91…" />
                </Field>
              </div>
              <Field label="Your address">
                <Textarea value={form.senderAddress} onChange={update('senderAddress')} placeholder="Your postal address" rows={2} />
              </Field>
              <Field label="Your email">
                <Input type="email" value={form.senderEmail} onChange={update('senderEmail')} placeholder="you@example.com" />
              </Field>

              <div className="my-2 h-px bg-border/60" />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Recipient name *">
                  <Input value={form.recipientName} onChange={update('recipientName')} placeholder="Person / entity being notified" />
                </Field>
                <Field label="Notice type">
                  <select
                    value={form.noticeType}
                    onChange={update('noticeType')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {noticeTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Recipient address">
                <Textarea value={form.recipientAddress} onChange={update('recipientAddress')} placeholder="Recipient's postal address" rows={2} />
              </Field>

              <Field label="Subject">
                <Input value={form.subject} onChange={update('subject')} placeholder="Short subject line" />
              </Field>
              <Field label="Facts of the matter *">
                <Textarea
                  value={form.facts}
                  onChange={update('facts')}
                  placeholder="Describe what happened — dates, agreements, breaches, amounts owed…"
                  rows={4}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Relief amount (₹)">
                  <Input type="number" value={form.reliefAmount} onChange={update('reliefAmount')} placeholder="0" />
                </Field>
                <Field label="Respond within (days)">
                  <Input type="number" value={form.responseDays} onChange={update('responseDays')} placeholder="15" />
                </Field>
              </div>
              <Field label="Specific demand">
                <Textarea value={form.demand} onChange={update('demand')} placeholder="What you want the recipient to do" rows={2} />
              </Field>

              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>A 60-day notice is mandatory before suing the government under Section 80 CPC. This draft is a starting point — consult an advocate before sending.</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={generate} disabled={generating} className="flex-1 gap-2">
                  {generating ? <ThinkingPulse className="text-white" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? 'Drafting…' : 'Generate notice'}
                </Button>
                <Button variant="outline" onClick={reset} disabled={generating}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="glass-strong sticky top-8 h-fit border-border/60">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>Your drafted legal notice.</CardDescription>
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
                <div className="py-4"><ThinkingPulse /></div>
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
                    <ScrollText className="h-6 w-6" />
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

function buildNotice(f: any): string {
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  return `LEGAL NOTICE

To,
${f.recipientName},
${f.recipientAddress || '[Recipient address]'}

Date: ${date}

Subject: ${f.subject || `Notice regarding ${f.noticeType}`}

Sir/Madam,

Under instructions from and on behalf of my client, ${f.senderName}, residing at ${f.senderAddress || '[address]'}, I hereby serve upon you the following legal notice:

1. That my client ${f.facts}

2. That in spite of repeated requests and demands made by my client, you have failed to ${f.demand || 'resolve the matter'}.

3. That my client has thereby suffered loss and hardship, and the amount due and payable by you is ₹${f.reliefAmount || '—'}.

4. That in the circumstances, my client is entitled to ${f.demand || 'the relief claimed'}.

I, therefore, through this notice, call upon you to comply with the aforesaid demand within ${f.responseDays || '15'} days from the receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you in the competent court of law at your own risk as to cost and consequences.

A copy of this notice is retained in my office for record and further necessary action.

Place: __________
Date: ${date}

Through Advocate,

(${f.senderName})
`;
}
