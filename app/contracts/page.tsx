'use client';
import jsPDF from 'jspdf';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Sparkles, Download, Copy, Check, RotateCcw,
  Info, FileDown, Loader2, Save, PenTool,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Reveal } from '@/components/nyaya/reveal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const CONTRACT_TYPES = [
  'Non-Disclosure Agreement (NDA)',
  'Lease Agreement (Residential)',
  'Lease Agreement (Commercial)',
  'Partnership Deed',
  'Employment Contract',
  'Service Level Agreement (SLA)'
];

interface ContractForm {
  contract_type: string;
  party_a_name: string;
  party_b_name: string;
  jurisdiction: string;
  effective_date: string;
  custom_clauses: string;
}

export default function ContractsPage() {
  return (
    <AppShell>
      <ContractGenerator />
    </AppShell>
  );
}

function ContractGenerator() {
  const [form, setForm] = React.useState<ContractForm>({
    contract_type: CONTRACT_TYPES[0],
    party_a_name: '',
    party_b_name: '',
    jurisdiction: 'India',
    effective_date: new Date().toISOString().split('T')[0],
    custom_clauses: '',
  });

  const [generating, setGenerating] = React.useState(false);
  const [contractText, setContractText] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const update = (k: keyof ContractForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.party_a_name.trim()) { toast.error('Party A name is required.'); return false; }
    if (!form.party_b_name.trim()) { toast.error('Party B name is required.'); return false; }
    if (!form.effective_date) { toast.error('Effective date is required.'); return false; }
    return true;
  };

  const generate = async () => {
    if (!validate()) return;
    setGenerating(true);
    setContractText(null);
    try {
      const res = await fetch(`${API_URL}/contract/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Server error: ${res.status}`);
      }
      const data = await res.json();
      setContractText(data.contract_text);
      toast.success('Contract drafted successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate Contract. Check backend connection.');
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setContractText(null);
    setForm((f) => ({ ...f, party_a_name: '', party_b_name: '', custom_clauses: '' }));
  };

  const copy = async () => {
    if (!contractText) return;
    try {
      await navigator.clipboard.writeText(contractText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Clipboard access denied');
    }
  };

  const downloadPDF = async () => {
    if (!contractText) return;
    try {
      const { downloadPDF: exportPDF } = await import('@/lib/exporter');
      await exportPDF(contractText, `Contract_${form.party_a_name}_vs_${form.party_b_name}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('PDF generation failed');
    }
  };

  const downloadDOCX = async () => {
    if (!contractText) return;
    try {
      const { downloadDOCX: exportDOCX } = await import('@/lib/exporter');
      await exportDOCX(contractText, `Contract_${form.party_a_name}_vs_${form.party_b_name}.docx`);
    } catch (err) {
      console.error(err);
      toast.error('DOCX generation failed');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Reveal>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Contract Generator</h1>
              <p className="text-sm text-muted-foreground">Draft complex legal agreements and contracts tailored to your needs.</p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Reveal>
          <Card className="glass-strong border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Contract Details</CardTitle>
              <CardDescription>Fill in the parties and specifics to draft your agreement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Contract Type *">
                <select
                  value={form.contract_type}
                  onChange={update('contract_type')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CONTRACT_TYPES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Party A (e.g. Disclosing Party / Lessor) *">
                  <Input
                    value={form.party_a_name}
                    onChange={update('party_a_name')}
                    placeholder="Full Name or Company"
                  />
                </Field>
                <Field label="Party B (e.g. Receiving Party / Lessee) *">
                  <Input
                    value={form.party_b_name}
                    onChange={update('party_b_name')}
                    placeholder="Full Name or Company"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Jurisdiction">
                  <Input
                    value={form.jurisdiction}
                    onChange={update('jurisdiction')}
                    placeholder="State/Country (e.g. Delhi, India)"
                  />
                </Field>
                <Field label="Effective Date *">
                  <Input
                    type="date"
                    value={form.effective_date}
                    onChange={update('effective_date')}
                  />
                </Field>
              </div>

              <Field label="Additional Custom Clauses (Optional)">
                <Textarea
                  value={form.custom_clauses}
                  onChange={update('custom_clauses')}
                  placeholder="Specify any special terms, payment amounts, or specific conditions to include..."
                  rows={4}
                />
              </Field>

              <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p>This is an AI-generated draft meant for preliminary use. Always consult a legal professional before signing binding agreements.</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generate}
                  disabled={generating}
                  className="flex-1 gap-2 rounded-xl"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Drafting Contract…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Contract
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

        {/* Preview Panel */}
        <Reveal delay={0.08}>
          <div className="sticky top-6">
            <Card className="glass-strong border-border/60 h-fit">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">Preview</CardTitle>
                </div>

                {contractText && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <Button size="sm" variant="ghost" onClick={copy} className="gap-1.5 rounded-lg h-8">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={downloadPDF} className="gap-1.5 rounded-lg h-8">
                      <FileDown className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={downloadDOCX} className="gap-1.5 rounded-lg h-8">
                      <FileDown className="h-3.5 w-3.5" />
                      DOCX
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
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Generating contract via Legal LLM…
                      </div>
                      <div className="space-y-2.5">
                        {[88, 70, 85, 60, 78, 65, 90, 80].map((w, i) => (
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
                  ) : contractText ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="relative rounded-2xl border border-border/60 bg-card overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary/40" />
                        <div className="p-4 sm:p-5">
                          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90 max-h-[520px] overflow-y-auto">
                            {contractText}
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
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                        <FileText className="h-7 w-7 text-primary/60" />
                      </div>
                      <p className="text-sm font-semibold text-foreground/80">Your draft will appear here</p>
                      <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                        Select a contract type and provide details to generate a legal draft.
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
