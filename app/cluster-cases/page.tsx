'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertTriangle, ShieldAlert, FileText, Check, Loader2, Sparkles, Scale, Download, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Reveal } from '@/components/nyaya/reveal';
import { ACTIVE_CLUSTER_CASES, ClusterCase } from '@/lib/ekjut-demo';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export default function ClusterCasesPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        <Reveal>
          <div className="flex items-center gap-4 border-b border-border/60 pb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">The Ekjut Engine</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Clusters citizens with the same opposing party into a joint legal filing — turning weak individual complaints into strong collective ones.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Active Collective Actions
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {ACTIVE_CLUSTER_CASES.map((cluster) => (
                <Card key={cluster.id} className="glass-strong border-border/60 hover:border-indigo-500/30 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {cluster.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <Users className="h-3 w-3" />
                        {cluster.affectedCount} Joined
                      </span>
                    </div>
                    <CardTitle className="text-base leading-tight">{cluster.title}</CardTitle>
                    <CardDescription className="text-xs text-rose-500 font-medium">Opposing Party: {cluster.opposingParty}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{cluster.description}</p>
                    <Button className="w-full gap-2 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 hover:text-indigo-700 shadow-none border border-indigo-500/20">
                      <Scale className="h-4 w-4" /> Join Action
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="grid gap-6 lg:grid-cols-2 mt-8">
            <NewClusterForm />
            <ClusterPreview />
          </div>
        </Reveal>
      </div>
    </AppShell>
  );
}

function NewClusterForm() {
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', opposing: '', category: '', description: '' });

  const update = (k: keyof typeof form) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.opposing || !form.description) {
      toast.error('Please fill required fields.');
      return;
    }
    
    // Simulate API call for the demo
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      
      // Dispatch an event so the preview pane can generate the document
      window.dispatchEvent(new CustomEvent('ekjut:generate', { detail: form }));
    }, 1500);
  };

  return (
    <Card className="glass-strong border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Start a New Collective Action</CardTitle>
        <CardDescription>Report a widespread issue to find allies and generate a joint PIL or Class Action draft.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lead Complainant Name *</Label>
              <Input value={form.name} onChange={update('name')} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground text-rose-500 font-semibold flex items-center gap-1">
                Opposing Party / Authority *
              </Label>
              <Input value={form.opposing} onChange={update('opposing')} placeholder="e.g. Supertech Builders, Delhi Jal Board" className="border-rose-500/30 focus-visible:ring-rose-500/50" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Issue Category</Label>
            <select value={form.category} onChange={update('category')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select a category</option>
              <option value="consumer">Consumer Rights / Real Estate</option>
              <option value="environment">Environment / Public Health</option>
              <option value="infrastructure">Public Infrastructure</option>
              <option value="financial">Financial / Investment Scam</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Widespread Issue Description *</Label>
            <Textarea value={form.description} onChange={update('description')} rows={4} placeholder="Describe the issue. How many people do you think are affected by this opposing party?" />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning for allies...</> : <><Users className="h-4 w-4" /> Start Collective Action</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ClusterPreview() {
  const [generating, setGenerating] = React.useState(false);
  const [draft, setDraft] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleGenerate = async (e: any) => {
      const form = e.detail;
      setGenerating(true);
      setDraft(null);

      // Simulate the backend generating a PIL / Joint Action
      const prompt = `Draft a formal Public Interest Litigation (PIL) or Joint Class Action Legal Notice against: ${form.opposing}. The issue is: ${form.description}. Complainant: ${form.name}.`;
      
      try {
        const chatRes = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: prompt, language: "en" }),
        });

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setDraft(chatData.answer);
          toast.success('Joint Action Draft Generated!');
        } else {
          throw new Error("Failed");
        }
      } catch (err) {
        // Fallback for demo if backend is down
        setTimeout(() => {
          setDraft(`IN THE HON'BLE HIGH COURT / NCDRC\n\nIN THE MATTER OF:\n${form.name} & ORS. ... COMPLAINANTS\n\nVERSUS\n\n${form.opposing.toUpperCase()} ... RESPONDENT\n\nLEGAL NOTICE FOR COLLECTIVE ACTION\n\nSir/Madam,\nUnder instructions from my clients, and on behalf of the larger affected public, I hereby serve you with this Joint Legal Notice...\n\n[AI GENERATED DRAFT FOR DEMO PURPOSES BASED ON: ${form.description}]`);
        }, 3000);
      } finally {
        setGenerating(false);
      }
    };

    window.addEventListener('ekjut:generate', handleGenerate);
    return () => window.removeEventListener('ekjut:generate', handleGenerate);
  }, []);

  return (
    <Card className="glass-strong border-border/60 h-fit">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">Joint Draft Preview</CardTitle>
          <CardDescription>Your AI-drafted PIL or Collective Action.</CardDescription>
        </div>
        {draft && (
           <div className="flex gap-1.5">
             <Button size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => toast.success("Copied")}><Copy className="h-3.5 w-3.5" /></Button>
             <Button size="sm" variant="ghost" className="h-8 rounded-lg"><Download className="h-3.5 w-3.5" /></Button>
           </div>
        )}
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {generating ? (
             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-8">
               <div className="flex items-center gap-3 text-sm text-indigo-600 font-medium">
                 <Loader2 className="h-4 w-4 animate-spin" /> Drafting Joint Action using Llama 3.3...
               </div>
               <div className="space-y-2.5">
                 {[88, 70, 85, 60, 78].map((w, i) => (
                   <div key={i} className="h-3 rounded-full bg-muted/60 animate-pulse" style={{ width: `${w}%` }} />
                 ))}
               </div>
             </motion.div>
          ) : draft ? (
             <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl border border-border/60 bg-card overflow-hidden">
               <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
               <div className="p-4 sm:p-5">
                 <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90 max-h-[400px] overflow-y-auto">
                   {draft}
                 </pre>
               </div>
             </motion.div>
          ) : (
             <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
               <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-4">
                 <FileText className="h-7 w-7 text-indigo-500/60" />
               </div>
               <p className="text-sm font-semibold text-foreground/80">Submit an issue to generate</p>
               <p className="mt-1 text-xs text-muted-foreground max-w-xs">Start a collective action on the left to see the AI-generated PIL draft here.</p>
             </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
