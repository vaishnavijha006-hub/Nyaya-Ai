'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Sparkles, Download, Copy, Check, RotateCcw,
  Info, FileDown, Globe, Loader2, Save, History,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Reveal } from '@/components/nyaya/reveal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'hi', label: '🇮🇳 Hindi' },
  { code: 'mr', label: '🇮🇳 Marathi' },
  { code: 'ta', label: '🇮🇳 Tamil' },
  { code: 'te', label: '🇮🇳 Telugu' },
  { code: 'gu', label: '🇮🇳 Gujarati' },
  { code: 'bn', label: '🇮🇳 Bengali' },
  { code: 'kn', label: '🇮🇳 Kannada' },
  { code: 'ml', label: '🇮🇳 Malayalam' },
  { code: 'pa', label: '🇮🇳 Punjabi' },
  { code: 'ur', label: '🇵🇰 Urdu' },
];

const DEPARTMENTS = [
  'Municipal Corporation',
  'Public Works Department',
  'Police Department',
  'Revenue Department',
  'Education Department',
  'Health Department',
  'Electricity Board',
  'Water Supply Department',
  'Food & Civil Supplies',
  'Transport Department',
  'Other',
];

interface RtiForm {
  department: string;
  public_authority: string;
  information_required: string;
  applicant_name: string;
  address: string;
  contact: string;
  email: string;
  language: string;
}

interface RtiHistoryItem {
  id: string;
  department: string;
  authority: string;
  application: string;
  language: string;
  created_at: string;
}

export default function RTIPage() {
  return (
    <AppShell>
      <RTIGenerator />
    </AppShell>
  );
}

function RTIGenerator() {
  const [form, setForm] = React.useState<RtiForm>({
    department: DEPARTMENTS[0],
    public_authority: '',
    information_required: '',
    applicant_name: '',
    address: '',
    contact: '',
    email: '',
    language: 'en',
  });

  const [generating, setGenerating] = React.useState(false);
  const [application, setApplication] = React.useState<string | null>(null);
  const [responseLang, setResponseLang] = React.useState<string>('English');
  const [copied, setCopied] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [history, setHistory] = React.useState<RtiHistoryItem[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);

  const update = (k: keyof RtiForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.applicant_name.trim()) { toast.error('Applicant name is required.'); return false; }
    if (!form.public_authority.trim()) { toast.error('Public authority is required.'); return false; }
    if (!form.information_required.trim()) { toast.error('Information required field cannot be empty.'); return false; }
    return true;
  };

  const generate = async () => {
    if (!validate()) return;
    setGenerating(true);
    setApplication(null);
    try {
      const res = await fetch(`${API_URL}/rti/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Server error: ${res.status}`);
      }
      const data = await res.json();
      setApplication(data.application);
      setResponseLang(data.language || 'English');
      toast.success('RTI application drafted successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate RTI. Check backend connection.');
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setApplication(null);
    setForm((f) => ({ ...f, information_required: '', public_authority: '' }));
  };

  const copy = async () => {
    if (!application) return;
    try {
      await navigator.clipboard.writeText(application);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Clipboard access denied');
    }
  };

  const downloadPDF = async () => {
    if (!application) return;
    try {
      const { downloadPDF: exportPDF } = await import('@/lib/exporter');
      await exportPDF(application, `RTI_${form.applicant_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('PDF generation failed');
    }
  };

  const downloadDOCX = async () => {
    if (!application) return;
    try {
      const { downloadDOCX: exportDOCX } = await import('@/lib/exporter');
      await exportDOCX(application, `RTI_${form.applicant_name.replace(/\s+/g, '_')}.docx`);
    } catch (err) {
      console.error(err);
      toast.error('DOCX generation failed');
    }
  };

  const saveToSupabase = async () => {
    if (!application) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Please sign in to save your RTI history.'); return; }
      const { error } = await supabase.from('rti_history').insert({
        user_id: user.id,
        department: form.department,
        authority: form.public_authority,
        application,
        language: responseLang,
      });
      if (error) throw error;
      toast.success('RTI saved to your history!');
      loadHistory();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save RTI history');
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('rti_history')
        .select('id, department, authority, application, language, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setHistory(data as RtiHistoryItem[]);
    } catch { /* silent */ }
  };

  React.useEffect(() => { loadHistory(); }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <Reveal>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">RTI Generator</h1>
              <p className="text-sm text-muted-foreground">Draft a professional RTI application in any Indian language using AI.</p>
            </div>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2 rounded-xl"
            >
              <History className="h-4 w-4" />
              History ({history.length})
            </Button>
          )}
        </div>
      </Reveal>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card className="glass-strong border-border/60">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Recent RTI Drafts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setApplication(item.application); setResponseLang(item.language); setShowHistory(false); }}
                    className="w-full text-left p-3 rounded-xl border border-border/60 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{item.authority || item.department}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {new Date(item.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{item.language}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Form ── */}
        <Reveal>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
              <CardDescription>Fill in the fields below. Fields marked with * are required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language selector */}
              <Field label="Response Language">
                <select
                  value={form.language}
                  onChange={update('language')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name *">
                  <Input
                    id="rti-name"
                    value={form.applicant_name}
                    onChange={update('applicant_name')}
                    placeholder="Your full name"
                  />
                </Field>
                <Field label="Contact Number">
                  <Input
                    id="rti-contact"
                    value={form.contact}
                    onChange={update('contact')}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </Field>
              </div>

              <Field label="Address">
                <Textarea
                  id="rti-address"
                  value={form.address}
                  onChange={update('address')}
                  placeholder="Your postal address"
                  rows={2}
                />
              </Field>

              <Field label="Email">
                <Input
                  id="rti-email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@example.com"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Public Authority *">
                  <Input
                    id="rti-authority"
                    value={form.public_authority}
                    onChange={update('public_authority')}
                    placeholder="e.g. Municipal Corporation"
                  />
                </Field>
                <Field label="Department">
                  <select
                    value={form.department}
                    onChange={update('department')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Information Required *">
                <Textarea
                  id="rti-info"
                  value={form.information_required}
                  onChange={update('information_required')}
                  placeholder="Describe the information you want to request in detail. Be specific about what documents, records, or data you need."
                  rows={5}
                />
              </Field>

              {/* RTI Info Notice */}
              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>A fee of ₹10 applies. The authority must respond within 30 days under Section 7(1) of the RTI Act, 2005. This is an AI-generated draft — verify with your local PIO.</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  id="rti-generate-btn"
                  onClick={generate}
                  disabled={generating}
                  className="flex-1 gap-2 rounded-xl"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Drafting application…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate RTI Application
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  disabled={generating}
                  className="rounded-xl"
                  aria-label="Reset form"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        {/* ── Preview Panel ── */}
        <Reveal delay={0.08}>
          <div className="sticky top-6">
            <Card className="glass-strong border-border/60 h-fit">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Preview
                    {application && (
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {responseLang}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Your AI-drafted RTI application.</CardDescription>
                </div>

                {application && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <Button id="rti-copy-btn" size="sm" variant="ghost" onClick={copy} className="gap-1.5 rounded-lg h-8">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button id="rti-pdf-btn" size="sm" variant="ghost" onClick={downloadPDF} className="gap-1.5 rounded-lg h-8">
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                    <Button id="rti-docx-btn" size="sm" variant="ghost" onClick={downloadDOCX} className="gap-1.5 rounded-lg h-8">
                      <FileDown className="h-3.5 w-3.5" />
                      DOCX
                    </Button>
                    <Button
                      id="rti-save-btn"
                      size="sm"
                      variant="ghost"
                      onClick={saveToSupabase}
                      disabled={saving}
                      className="gap-1.5 rounded-lg h-8"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                    <Button id="rti-regen-btn" size="sm" variant="ghost" onClick={generate} disabled={generating} className="gap-1.5 rounded-lg h-8">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Regen
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <AnimatePresence mode="wait">
                  {generating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 py-8"
                    >
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                        </span>
                        Generating RTI application using Groq Llama 3.3…
                      </div>
                      <div className="space-y-2.5">
                        {[88, 70, 85, 60, 78].map((w, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="h-3 rounded-full bg-muted/60 animate-pulse"
                            style={{ width: `${w}%` }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : application ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Document card */}
                      <div className="relative rounded-2xl border border-border/60 bg-card overflow-hidden">
                        {/* Top accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
                        <div className="p-4 sm:p-5">
                          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90 max-h-[520px] overflow-y-auto">
                            {application}
                          </pre>
                        </div>
                        {/* Bottom fade */}
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                        <FileText className="h-7 w-7 text-primary/60" />
                      </div>
                      <p className="text-sm font-semibold text-foreground/80">Your draft will appear here</p>
                      <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                        Fill in the form on the left and click "Generate RTI Application". The AI will draft a formal application for you.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
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
