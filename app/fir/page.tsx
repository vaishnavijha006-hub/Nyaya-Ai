'use client';

import jsPDF from 'jspdf';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Sparkles, Download, Copy, Check, RotateCcw,
  Info, FileDown, Loader2, Save, History, Calendar, MapPin, User, Globe, AlertTriangle
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
  { code: 'ur', label: '🇮🇳 Urdu' },
  { code: 'hinglish', label: '🇮🇳 Hinglish' },
];

interface FirForm {
  complainant_name: string;
  date_of_incident: string;
  location: string;
  incident_description: string;
  suspect_details: string;
  police_station: string;
  contact: string;
  language: string;
}

interface FirHistoryItem {
  id: string;
  complainant_name: string;
  location: string;
  fir_text: string;
  language: string;
  created_at: string;
}

export default function FIRPage() {
  return (
    <AppShell>
      <FIRGenerator />
    </AppShell>
  );
}

function FIRGenerator() {
  const [form, setForm] = React.useState<FirForm>({
    complainant_name: '',
    date_of_incident: '',
    location: '',
    incident_description: '',
    suspect_details: '',
    police_station: '',
    contact: '',
    language: 'en',
  });

  const [generating, setGenerating] = React.useState(false);
  const [firText, setFirText] = React.useState<string | null>(null);
  const [responseLang, setResponseLang] = React.useState<string>('English');
  const [copied, setCopied] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [history, setHistory] = React.useState<FirHistoryItem[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);

  const update = (k: keyof FirForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.complainant_name.trim()) {
      toast.error('Complainant Name is required.');
      return false;
    }
    if (!form.date_of_incident.trim()) {
      toast.error('Date of Incident is required.');
      return false;
    }
    if (!form.location.trim()) {
      toast.error('Location is required.');
      return false;
    }
    if (!form.incident_description.trim()) {
      toast.error('Incident Description cannot be empty.');
      return false;
    }
    return true;
  };

  const generate = async () => {
    if (!validate()) return;
    setGenerating(true);
    setFirText(null);
    try {
      // Primary attempt: /fir/generate
      let success = false;
      try {
        const res = await fetch(`${API_URL}/fir/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const data = await res.json();
          setFirText(data.fir_text || data.application || data.answer);
          setResponseLang(data.language || 'English');
          toast.success('FIR complaint drafted successfully!');
          success = true;
        }
      } catch (e) {
        console.warn('Dedicated FIR endpoint failed, attempting fallback to /chat:', e);
      }

      // Fallback attempt: /chat/ endpoint with explicit FIR prompt if primary failed
      if (!success) {
        const prompt = `Draft a formal police FIR complaint letter under Section 173 BNSS / Section 154 CrPC based on the following details:
- Complainant Name: ${form.complainant_name}
- Date of Incident: ${form.date_of_incident}
- Location: ${form.location}
- Police Station: ${form.police_station || 'Nearest Police Station'}
- Contact: ${form.contact || 'Not provided'}
- Suspect Details: ${form.suspect_details || 'Unknown / Unidentified person(s)'}
- Incident Description: ${form.incident_description}
Language requested: ${form.language}`;

        const chatRes = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: prompt, language: form.language }),
        });

        if (!chatRes.ok) {
          const err = await chatRes.json().catch(() => ({}));
          throw new Error(err?.detail || `Server error: ${chatRes.status}`);
        }

        const chatData = await chatRes.json();
        setFirText(chatData.answer);
        setResponseLang(chatData.response_language || 'English');
        toast.success('FIR complaint drafted successfully!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to draft FIR. Check backend connection.');
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setFirText(null);
    setForm((f) => ({
      ...f,
      incident_description: '',
      suspect_details: '',
      date_of_incident: '',
      location: '',
      police_station: '',
    }));
  };

  const copy = async () => {
    if (!firText) return;
    try {
      await navigator.clipboard.writeText(firText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Clipboard access denied');
    }
  };

  const downloadPDF = async () => {
    if (!firText) return;
    try {
      const { downloadPDF: exportPDF } = await import('@/lib/exporter');
      await exportPDF(firText, `FIR_Complaint_${form.complainant_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('PDF generation failed');
    }
  };

  const downloadDOCX = async () => {
    if (!firText) return;
    try {
      const { downloadDOCX: exportDOCX } = await import('@/lib/exporter');
      await exportDOCX(firText, `FIR_Complaint_${form.complainant_name.replace(/\s+/g, '_')}.docx`);
    } catch (err) {
      console.error(err);
      toast.error('DOCX generation failed');
    }
  };

  const downloadFirPdf = () => {
    if (!firText) return;
    try {
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('FIR Complaint Letter', pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Divider
      doc.setDrawColor(180, 180, 180);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // Meta details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      const metaLines = [
        `Date: ${dateStr}`,
        `Complainant Name: ${form.complainant_name}`,
        `Date of Incident: ${form.date_of_incident}`,
        `Location of Incident: ${form.location}`,
        ...(form.police_station ? [`Police Station: ${form.police_station}`] : []),
        ...(form.suspect_details ? [`Suspect Details: ${form.suspect_details}`] : []),
      ];
      metaLines.forEach((line) => {
        const wrapped = doc.splitTextToSize(line, contentWidth);
        wrapped.forEach((l: string) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(l, margin, y);
          y += 6;
        });
      });
      y += 3;

      // Second divider
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // Body
      doc.setFontSize(11);
      const bodyLines = doc.splitTextToSize(firText, contentWidth);
      bodyLines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      });

      doc.save(`FIR_Complaint_${Date.now()}.pdf`);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('PDF generation failed');
    }
  };

  const saveToSupabase = async () => {
    if (!firText) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to save your FIR history.');
        return;
      }
      const { error } = await supabase.from('fir_history').insert({
        user_id: user.id,
        complainant_name: form.complainant_name,
        location: form.location,
        fir_text: firText,
        language: responseLang,
      });
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('404') || error.message.includes('not found')) {
          console.warn('[Supabase Notice] fir_history table does not exist in database migration yet.');
          toast.error('FIR history saving requires running database migration in Supabase SQL editor.');
        } else {
          throw error;
        }
      } else {
        toast.success('FIR saved to your history!');
        loadHistory();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save FIR history');
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('fir_history')
        .select('id, complainant_name, location, fir_text, language, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        setHistory(data as FirHistoryItem[]);
      }
    } catch (err) {
      console.warn('[Supabase Notice] Error loading FIR history:', err);
    }
  };

  React.useEffect(() => { loadHistory(); }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <Reveal>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/25">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">FIR Drafting Assistant</h1>
              <p className="text-sm text-muted-foreground">Draft a formal Police FIR Complaint letter under BNSS / CrPC in any Indian language.</p>
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
                  Recent FIR Drafts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setFirText(item.fir_text); setResponseLang(item.language); setShowHistory(false); }}
                    className="w-full text-left p-3 rounded-xl border border-border/60 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">{item.complainant_name} ({item.location})</span>
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
        {/* ── Left Pane: Form ── */}
        <Reveal>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">FIR Complaint Details</CardTitle>
              <CardDescription>Fill in the fields below. Fields marked with * are required.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language selector */}
              <Field label="Response Language" icon={<Globe className="h-3.5 w-3.5 text-muted-foreground" />}>
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
                <Field label="Complainant Name *" icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}>
                  <Input
                    id="fir-complainant-name"
                    value={form.complainant_name}
                    onChange={update('complainant_name')}
                    placeholder="Full name of complainant"
                  />
                </Field>
                <Field label="Date of Incident *" icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />}>
                  <Input
                    id="fir-date"
                    type="text"
                    value={form.date_of_incident}
                    onChange={update('date_of_incident')}
                    placeholder="e.g. 08 August 2026 at 9:30 PM"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location *" icon={<MapPin className="h-3.5 w-3.5 text-muted-foreground" />}>
                  <Input
                    id="fir-location"
                    value={form.location}
                    onChange={update('location')}
                    placeholder="Location where incident occurred"
                  />
                </Field>
                <Field label="Police Station Jurisdiction">
                  <Input
                    id="fir-police-station"
                    value={form.police_station}
                    onChange={update('police_station')}
                    placeholder="e.g. Connaught Place Police Station"
                  />
                </Field>
              </div>

              <Field label="Incident Description *" icon={<AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}>
                <Textarea
                  id="fir-description"
                  value={form.incident_description}
                  onChange={update('incident_description')}
                  placeholder="Describe the incident in detail — chronology of events, weapons/stolen items involved, injuries, witnesses, or any relevant details."
                  rows={5}
                />
              </Field>

              <Field label="Suspect Details">
                <Input
                  id="fir-suspect-details"
                  value={form.suspect_details}
                  onChange={update('suspect_details')}
                  placeholder="Name, physical description, vehicle number, or state 'Unknown accused'"
                />
              </Field>

              {/* FIR Notice */}
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p>FIR registration is mandatory for cognizable offences under Section 173 BNSS (Sec 154 CrPC). This AI-generated draft must be submitted to the officer-in-charge at your local police station.</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  id="fir-generate-btn"
                  onClick={generate}
                  disabled={generating}
                  className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Drafting FIR…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Draft FIR
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

        {/* ── Right Pane: Preview ── */}
        <Reveal delay={0.08}>
          <div className="sticky top-6">
            <Card className="glass-strong border-border/60 h-fit">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Preview
                    {firText && (
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {responseLang}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Your AI-drafted FIR complaint letter.</CardDescription>
                </div>

                {firText && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <Button id="fir-copy-btn" size="sm" variant="ghost" onClick={copy} className="gap-1.5 rounded-lg h-8">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button id="fir-pdf-btn" size="sm" variant="ghost" onClick={downloadPDF} className="gap-1.5 rounded-lg h-8">
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                    <Button
                      id="fir-jspdf-btn"
                      size="sm"
                      variant="outline"
                      onClick={downloadFirPdf}
                      disabled={!firText}
                      className="gap-1.5 rounded-lg h-8"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      Download PDF
                    </Button>
                    <Button id="fir-docx-btn" size="sm" variant="ghost" onClick={downloadDOCX} className="gap-1.5 rounded-lg h-8">
                      <FileDown className="h-3.5 w-3.5" />
                      Download DOCX
                    </Button>
                    <Button
                      id="fir-save-btn"
                      size="sm"
                      variant="ghost"
                      onClick={saveToSupabase}
                      disabled={saving}
                      className="gap-1.5 rounded-lg h-8"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                    <Button id="fir-regen-btn" size="sm" variant="ghost" onClick={generate} disabled={generating} className="gap-1.5 rounded-lg h-8">
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
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500/50" />
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                        </span>
                        Drafting police FIR complaint using Groq Llama 3.3…
                      </div>
                      <div className="space-y-2.5">
                        {[88, 70, 85, 60, 78, 65, 82].map((w, i) => (
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
                  ) : firText ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Document card */}
                      <div className="relative rounded-2xl border border-border/60 bg-card overflow-hidden">
                        {/* Top accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-400" />
                        <div className="p-4 sm:p-5">
                          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90 max-h-[520px] overflow-y-auto">
                            {firText}
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
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 mb-4">
                        <ShieldAlert className="h-7 w-7 text-rose-500/60" />
                      </div>
                      <p className="text-sm font-semibold text-foreground/80">Your FIR draft will appear here</p>
                      <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                        Fill in the complainant, incident, and suspect details on the left and click "Draft FIR".
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

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
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
