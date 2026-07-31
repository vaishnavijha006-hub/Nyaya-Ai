'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText, Sparkles, Download, Copy, Check, RotateCcw,
  FileDown, Loader2, Save, History, AlertTriangle, Scale,
  User, MapPin, FileText, Clock, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Reveal } from '@/components/nyaya/reveal';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const NOTICE_TYPES = [
  { value: 'Salary Recovery Notice',   icon: '💼' },
  { value: 'Rent Notice',              icon: '🏠' },
  { value: 'Consumer Complaint Notice',icon: '🛒' },
  { value: 'Property Dispute Notice',  icon: '🏛️' },
  { value: 'Contract Breach Notice',   icon: '📋' },
  { value: 'Money Recovery Notice',    icon: '💰' },
  { value: 'Employment Notice',        icon: '👔' },
  { value: 'Custom Legal Notice',      icon: '⚖️' },
];

const LANGUAGES = [
  { code: 'en',       label: '🇬🇧 English'  },
  { code: 'hi',       label: '🇮🇳 Hindi'    },
  { code: 'mr',       label: '🇮🇳 Marathi'  },
  { code: 'ta',       label: '🇮🇳 Tamil'    },
  { code: 'te',       label: '🇮🇳 Telugu'   },
  { code: 'gu',       label: '🇮🇳 Gujarati' },
  { code: 'bn',       label: '🇮🇳 Bengali'  },
  { code: 'kn',       label: '🇮🇳 Kannada'  },
  { code: 'ml',       label: '🇮🇳 Malayalam'},
  { code: 'pa',       label: '🇮🇳 Punjabi'  },
  { code: 'ur',       label: '🇵🇰 Urdu'     },
  { code: 'hinglish', label: '🇮🇳 Hinglish' },
];

const SKELETON_WIDTHS = [92, 78, 86, 64, 80, 70, 88, 60];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NoticeForm {
  notice_type: string;
  sender_name: string;
  sender_address: string;
  recipient_name: string;
  recipient_address: string;
  subject: string;
  case_details: string;
  legal_demand: string;
  deadline_days: number;
  language: string;
}

interface HistoryItem {
  id: string;
  notice_type: string;
  recipient: string;
  notice: string;
  language: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Page entry
// ─────────────────────────────────────────────

export default function LegalNoticePage() {
  return (
    <AppShell>
      <LegalNoticeGenerator />
    </AppShell>
  );
}

// ─────────────────────────────────────────────
// Generator
// ─────────────────────────────────────────────

function LegalNoticeGenerator() {
  const [form, setForm] = React.useState<NoticeForm>({
    notice_type:      NOTICE_TYPES[0].value,
    sender_name:      '',
    sender_address:   '',
    recipient_name:   '',
    recipient_address:'',
    subject:          '',
    case_details:     '',
    legal_demand:     '',
    deadline_days:    15,
    language:         'en',
  });

  const [generating, setGenerating]       = React.useState(false);
  const [notice, setNotice]               = React.useState<string | null>(null);
  const [responseLang, setResponseLang]   = React.useState('English');
  const [copied, setCopied]               = React.useState(false);
  const [saving, setSaving]               = React.useState(false);
  const [history, setHistory]             = React.useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory]     = React.useState(false);

  // ── Helpers ──────────────────────────────
  const update =
    (k: keyof NoticeForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const updateNum =
    (k: keyof NoticeForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  const validate = () => {
    if (!form.sender_name.trim())    { toast.error('Sender name is required.');       return false; }
    if (!form.recipient_name.trim()) { toast.error('Recipient name is required.');    return false; }
    if (!form.case_details.trim())   { toast.error('Case details cannot be empty.');  return false; }
    if (!form.legal_demand.trim())   { toast.error('Legal demand cannot be empty.');  return false; }
    return true;
  };

  // ── Generate ─────────────────────────────
  const generate = async () => {
    if (!validate()) return;
    setGenerating(true);
    setNotice(null);
    try {
      const res = await fetch(`${API_URL}/legal-notice/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.detail ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      setNotice(data.notice);
      setResponseLang(data.language ?? 'English');
      toast.success('Legal notice drafted successfully!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to generate. Check backend connection.');
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setNotice(null);
    setForm((f) => ({
      ...f,
      case_details:      '',
      legal_demand:      '',
      subject:           '',
      recipient_name:    '',
      recipient_address: '',
    }));
  };

  // ── Copy ─────────────────────────────────
  const copy = async () => {
    if (!notice) return;
    try {
      await navigator.clipboard.writeText(notice);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Clipboard access denied');
    }
  };

  // ── PDF ──────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!notice) return;
    try {
      const { downloadPDF } = await import('@/lib/exporter');
      downloadPDF(notice, `Legal_Notice_${form.recipient_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('PDF generation failed');
    }
  };

  // ── DOCX ─────────────────────────────────
  const handleDownloadDOCX = async () => {
    if (!notice) return;
    try {
      const { downloadDOCX } = await import('@/lib/exporter');
      downloadDOCX(notice, `Legal_Notice_${form.recipient_name.replace(/\s+/g, '_')}.docx`);
    } catch (err) {
      console.error(err);
      toast.error('DOCX generation failed');
    }
  };

  // ── Supabase save ────────────────────────
  const saveHistory = async () => {
    if (!notice) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Sign in to save notices.'); return; }
      const { error } = await supabase.from('legal_notice_history').insert({
        user_id:     user.id,
        notice_type: form.notice_type,
        recipient:   form.recipient_name,
        notice,
        language:    responseLang,
      });
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('404')) {
          console.warn('[Supabase Warning] Table legal_notice_history does not exist yet.');
          toast.error('Legal notice history feature requires executing database migration.');
        } else {
          throw error;
        }
      } else {
        toast.success('Notice saved to history!');
        loadHistory();
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save history');
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('legal_notice_history')
        .select('id, notice_type, recipient, notice, language, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) setHistory(data as HistoryItem[]);
    } catch (err) {
      console.warn('[Supabase Warning] Could not load legal_notice_history:', err);
    }
  };

  React.useEffect(() => { loadHistory(); }, []);

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">

      {/* ── Page Header ── */}
      <Reveal>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-500/25">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Legal Notice Generator</h1>
              <p className="text-sm text-muted-foreground">
                Draft professional legal notices in 12 Indian languages using Groq Llama 3.3.
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory((s) => !s)}
              className="gap-2 rounded-xl"
            >
              <History className="h-4 w-4" />
              History ({history.length})
            </Button>
          )}
        </div>
      </Reveal>

      {/* ── Notice Type Picker ── */}
      <Reveal delay={0.04}>
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {NOTICE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setForm((f) => ({ ...f, notice_type: t.value }))}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-200',
                form.notice_type === t.value
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/20'
                  : 'border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:bg-accent/5',
              )}
            >
              <span className="shrink-0 text-base leading-none">{t.icon}</span>
              <span className="truncate">{t.value}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {/* ── History Panel ── */}
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
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <History className="h-4 w-4 text-primary" />
                  Recent Legal Notices
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 space-y-2 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setNotice(item.notice);
                      setResponseLang(item.language);
                      setShowHistory(false);
                    }}
                    className="w-full rounded-xl border border-border/60 p-3 text-left transition-colors hover:bg-accent/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-semibold">{item.notice_type}</span>
                      <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      To: {item.recipient} · {item.language}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ────────── Form Column ────────── */}
        <Reveal delay={0.06}>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Notice Details</CardTitle>
              <CardDescription>
                Fields marked * are required. Names, addresses and amounts are never translated.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

              {/* Language */}
              <FieldRow label="Output Language" icon={<Globe className="h-3.5 w-3.5" />}>
                <select
                  value={form.language}
                  onChange={update('language')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </FieldRow>

              <div className="my-1 border-t border-border/40" />

              {/* Sender block */}
              <SectionLabel icon={<User className="h-3 w-3" />} text="Sender" />

              <div className="grid gap-3 sm:grid-cols-2">
                <FieldRow label="Sender Name *">
                  <Input id="ln-sender-name" value={form.sender_name} onChange={update('sender_name')} placeholder="Your full name" />
                </FieldRow>
                <FieldRow label="Subject">
                  <Input id="ln-subject" value={form.subject} onChange={update('subject')} placeholder="Brief subject line" />
                </FieldRow>
              </div>

              <FieldRow label="Sender Address" icon={<MapPin className="h-3.5 w-3.5" />}>
                <Textarea id="ln-sender-addr" value={form.sender_address} onChange={update('sender_address')} placeholder="Your postal address" rows={2} />
              </FieldRow>

              <div className="my-1 border-t border-border/40" />

              {/* Recipient block */}
              <SectionLabel icon={<User className="h-3 w-3" />} text="Recipient" />

              <div className="grid gap-3 sm:grid-cols-2">
                <FieldRow label="Recipient Name *">
                  <Input id="ln-recipient-name" value={form.recipient_name} onChange={update('recipient_name')} placeholder="Recipient full name" />
                </FieldRow>
                <FieldRow label="Compliance Deadline (days)" icon={<Clock className="h-3.5 w-3.5" />}>
                  <Input
                    id="ln-deadline"
                    type="number"
                    min={1}
                    max={180}
                    value={form.deadline_days}
                    onChange={updateNum('deadline_days')}
                  />
                </FieldRow>
              </div>

              <FieldRow label="Recipient Address" icon={<MapPin className="h-3.5 w-3.5" />}>
                <Textarea id="ln-recipient-addr" value={form.recipient_address} onChange={update('recipient_address')} placeholder="Recipient's postal address" rows={2} />
              </FieldRow>

              <div className="my-1 border-t border-border/40" />

              {/* Case Details */}
              <FieldRow label="Case Details / Facts *" icon={<FileText className="h-3.5 w-3.5" />}>
                <Textarea
                  id="ln-case-details"
                  value={form.case_details}
                  onChange={update('case_details')}
                  placeholder="Describe the facts in detail — dates, amounts, agreements, events, and any prior communications."
                  rows={5}
                />
              </FieldRow>

              {/* Legal Demand */}
              <FieldRow label="Legal Demand *" icon={<Scale className="h-3.5 w-3.5" />}>
                <Textarea
                  id="ln-legal-demand"
                  value={form.legal_demand}
                  onChange={update('legal_demand')}
                  placeholder="State exactly what you demand — payment of ₹X, cessation of activity, delivery of goods, etc."
                  rows={3}
                />
              </FieldRow>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p>
                  AI-generated draft only. Verify with a licensed advocate before sending.
                  A 60-day notice is mandatory before suing the government (Section 80 CPC).
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  id="ln-generate-btn"
                  onClick={generate}
                  disabled={generating}
                  className="flex-1 gap-2 rounded-xl"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Drafting notice…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Legal Notice</>
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

        {/* ────────── Preview Column ────────── */}
        <Reveal delay={0.1}>
          <div className="sticky top-6">
            <Card className="glass-strong h-fit border-border/60">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    Preview
                    {notice && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {responseLang}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Your AI-drafted legal notice.</CardDescription>
                </div>

                {/* Action toolbar */}
                {notice && (
                  <div className="flex flex-wrap justify-end gap-1">
                    <ActionBtn id="ln-copy-btn"  onClick={copy}              icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}  label={copied ? 'Copied' : 'Copy'} />
                    <ActionBtn id="ln-pdf-btn"   onClick={handleDownloadPDF}  icon={<Download className="h-3.5 w-3.5" />}  label="PDF"  />
                    <ActionBtn id="ln-docx-btn"  onClick={handleDownloadDOCX} icon={<FileDown className="h-3.5 w-3.5" />}  label="DOCX" />
                    <ActionBtn id="ln-save-btn"  onClick={saveHistory}        disabled={saving} icon={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} label="Save" />
                    <ActionBtn id="ln-regen-btn" onClick={generate}           disabled={generating} icon={<RotateCcw className="h-3.5 w-3.5" />} label="Regen" />
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/50" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                        </span>
                        Drafting legal notice with Groq Llama 3.3…
                      </div>
                      <div className="space-y-2.5">
                        {SKELETON_WIDTHS.map((w, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="h-3 animate-pulse rounded-full bg-muted/60"
                            style={{ width: `${w}%` }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : notice ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
                        {/* Accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400/50" />
                        {/* Watermark */}
                        <div className="pointer-events-none absolute right-4 top-4 opacity-[0.04]">
                          <Scale className="h-24 w-24" />
                        </div>
                        <div className="p-4 sm:p-5">
                          <pre className="max-h-[540px] overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
                            {notice}
                          </pre>
                        </div>
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
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10">
                        <ScrollText className="h-7 w-7 text-amber-500/60" />
                      </div>
                      <p className="text-sm font-semibold text-foreground/80">
                        Your legal notice will appear here
                      </p>
                      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                        Select a notice type, fill in the details, then click{' '}
                        <span className="font-semibold text-foreground/70">"Generate Legal Notice"</span>.
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

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
      {text}
    </p>
  );
}

function FieldRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

function ActionBtn({
  id, onClick, icon, label, disabled = false,
}: {
  id: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Button id={id} size="sm" variant="ghost" onClick={onClick} disabled={disabled} className="h-8 gap-1.5 rounded-lg">
      {icon}
      {label}
    </Button>
  );
}
