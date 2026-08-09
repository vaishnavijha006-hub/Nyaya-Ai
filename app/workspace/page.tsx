'use client';

import * as React from 'react';
import { useResearch, type ResearchSession } from '@/hooks/use-research';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, BookOpen, Clock, Globe, ArrowRight, Sparkles, Copy, Check,
  FileText, Plus, X, Upload, CheckCircle2,
} from 'lucide-react';
import { KnowledgeClusterBadge } from '@/components/nyaya/knowledge-cluster-badge';
import { AppShell } from '@/components/nyaya/app-shell';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';

export default function WorkspacePage() {
  const { sessions, loading, refresh } = useResearch() as {
    sessions: ResearchSession[];
    loading: boolean;
    refresh?: () => void;
  };
  const [selectedSession, setSelectedSession] = React.useState<ResearchSession | null>(null);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [sessionNotes, setSessionNotes] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Floating note drawer (shown when sessions exist)
  const [showNewNote, setShowNewNote] = React.useState(false);

  // New note form state
  const [noteTitle, setNoteTitle] = React.useState('');
  const [noteContent, setNoteContent] = React.useState('');
  const [noteSaving, setNoteSaving] = React.useState(false);

  // PDF upload state
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadSessionId, setUploadSessionId] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── note helpers ────────────────────────────────────────────────────────────

  const loadNotesForSession = async (sessionId: string) => {
    setNotesLoading(true);
    setSessionNotes(null);
    try {
      const { data, error } = await supabase
        .from('research_notes')
        .select('notes')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      if (data) setSessionNotes(data.notes);
    } catch (err) {
      console.error(err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleSelectSession = (s: ResearchSession) => {
    setSelectedSession(s);
    loadNotesForSession(s.id);
  };

  const generateSessionNotes = async () => {
    if (!selectedSession) return;
    setNotesLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/research/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: selectedSession.answer,
          sources: selectedSession.sources.map((c) => ({
            primary_article: c.article_number || c.primary_article || '',
            page: c.page || null,
            content_preview: c.snippet || c.content_preview || '',
          })),
        }),
      });

      if (!res.ok) throw new Error('Notes generation failed');
      const data = await res.json();
      setSessionNotes(data.notes);

      const { data: { user } } = await supabase.auth.getUser();
      const notesPayload: Record<string, any> = {
        session_id: selectedSession.id,
        notes: data.notes,
      };
      if (user?.id) notesPayload.user_id = user.id;

      const { error: noteErr } = await supabase.from('research_notes').upsert(notesPayload);
      if (noteErr) console.warn('[Supabase Notice] Failed to save research_notes:', noteErr.message);

      const eventPayload: Record<string, any> = {
        event_type: 'generate_notes',
        metadata: { session_id: selectedSession.id },
      };
      if (user?.id) eventPayload.user_id = user.id;

      const { error: eventErr } = await supabase.from('analytics_events').insert(eventPayload);
      if (eventErr) console.warn('[Supabase Notice] Failed to save analytics_event:', eventErr.message);

      toast.success('AI Notes saved successfully to Workspace!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate study notes');
    } finally {
      setNotesLoading(false);
    }
  };

  const copyNotes = async () => {
    if (!sessionNotes) return;
    try {
      await navigator.clipboard.writeText(sessionNotes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Notes copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  // ── direct note creation ────────────────────────────────────────────────────

  const saveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }
    setNoteSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: Record<string, any> = {
        title: noteTitle.trim(),
        notes: noteContent.trim(),
      };
      if (user?.id) payload.user_id = user.id;

      const { error } = await supabase.from('research_notes').insert(payload);
      if (error) throw error;

      toast.success('Note saved to workspace!');
      setNoteTitle('');
      setNoteContent('');
      setShowNewNote(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Failed to save note');
    } finally {
      setNoteSaving(false);
    }
  };

  // ── pdf upload ──────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setUploadFile(f);
    setUploadProgress('idle');
    setUploadSessionId(null);
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setUploadFile(f);
    setUploadProgress('idle');
    setUploadSessionId(null);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!uploadFile) { toast.error('Please select a file first'); return; }
    setUploadProgress('uploading');
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      const res = await fetch('http://127.0.0.1:8000/pdf-upload/', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setUploadProgress('success');
      setUploadSessionId(data.session_id ?? null);
      toast.success('Document uploaded & analyzed!');
      refresh?.();
    } catch (err: any) {
      console.error(err);
      setUploadProgress('error');
      setUploadError(err?.message ?? 'Upload failed');
      toast.error('Upload failed — is the backend running?');
    }
  };

  // ── shared note/upload panel ────────────────────────────────────────────────

  const NoteUploadPanel = ({ onClose }: { onClose?: () => void }) => (
    <div className="w-full">
      {onClose && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold">Quick Add</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Tabs defaultValue="note">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="note" className="flex-1 text-xs">Create Note</TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 text-xs">Upload Document</TabsTrigger>
        </TabsList>

        {/* Tab 1: Create Note */}
        <TabsContent value="note" className="space-y-3 mt-0">
          <div className="space-y-1.5">
            <Label htmlFor="note-title" className="text-xs">Title</Label>
            <Input
              id="note-title"
              placeholder="E.g. Article 21 — Right to Life"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="text-xs h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-content" className="text-xs">Content</Label>
            <Textarea
              id="note-content"
              placeholder="Write your legal notes here…"
              rows={6}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="text-xs resize-none"
            />
          </div>
          <Button
            size="sm"
            className="w-full text-xs font-semibold rounded-xl"
            onClick={saveNote}
            disabled={noteSaving}
          >
            {noteSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Save Note
          </Button>
        </TabsContent>

        {/* Tab 2: Upload Document */}
        <TabsContent value="upload" className="space-y-3 mt-0">
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 py-10 cursor-pointer hover:bg-muted/20 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-7 w-7 text-muted-foreground/50" />
            {uploadFile ? (
              <p className="text-xs font-medium text-foreground">{uploadFile.name}</p>
            ) : (
              <>
                <p className="text-xs font-medium">Drag & drop or click to select</p>
                <p className="text-[10px] text-muted-foreground">Accepts .pdf, .txt, .docx</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {uploadProgress === 'uploading' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading and analyzing…
            </div>
          )}
          {uploadProgress === 'success' && (
            <div className="flex flex-col gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Upload successful!
              </div>
              {uploadSessionId && (
                <p className="text-[10px] text-muted-foreground">
                  Session ID: <code className="font-mono">{uploadSessionId}</code>
                </p>
              )}
            </div>
          )}
          {uploadProgress === 'error' && (
            <p className="text-xs text-rose-500">{uploadError ?? 'Upload failed'}</p>
          )}

          <Button
            size="sm"
            className="w-full text-xs font-semibold rounded-xl"
            onClick={handleUpload}
            disabled={!uploadFile || uploadProgress === 'uploading'}
          >
            {uploadProgress === 'uploading' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1" />
            )}
            Upload & Analyze
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen flex-col overflow-hidden bg-background">
        <div className="border-b border-border/60 px-6 py-4">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Research Workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your legal research, constitutional study notes, and workspace documents.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          /* ── Empty state with Note / Upload panel ── */
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <div className="w-full max-w-md">
              <div className="mb-6 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3 mx-auto" />
                <h3 className="text-sm font-semibold">No Research Sessions Found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Use the AI Chat assistant to ask constitutional queries. Meanwhile, you can create a note or upload a document.
                </p>
              </div>
              <Card className="rounded-2xl border-border/60 p-5">
                <NoteUploadPanel />
              </Card>
            </div>
          </div>
        ) : (
          /* ── Sessions exist ── */
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">
            {/* Sessions List */}
            <div className="w-full md:w-[380px] border-r border-border/60 flex flex-col overflow-y-auto">
              <div className="p-3 border-b border-border/60 bg-muted/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                  Session Log ({sessions.length})
                </span>
              </div>
              <div className="flex-1 divide-y divide-border/40">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`w-full p-4 text-left transition-colors hover:bg-accent/5 flex flex-col gap-1.5 ${
                      selectedSession?.id === s.id ? 'bg-primary/5 hover:bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 rounded bg-secondary px-1 py-0.5 text-[9px] font-medium text-secondary-foreground uppercase">
                        <Globe className="h-2.5 w-2.5" />
                        {s.detected_language}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-2">{s.query}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{s.answer}</p>
                    {s.articles_retrieved.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.articles_retrieved.map((art) => (
                          <span
                            key={art}
                            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.2 text-[8px] font-semibold border border-emerald-500/20"
                          >
                            Art. {art}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Session Detail Content Area */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
              {selectedSession ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-4">
                      <div>
                        <h2 className="text-base font-bold leading-tight">{selectedSession.query}</h2>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Research Session ID: {selectedSession.id}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={notesLoading}
                        onClick={generateSessionNotes}
                        className="shrink-0 gap-1.5 rounded-xl text-xs font-semibold"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {sessionNotes ? 'Regenerate Notes' : 'Generate Study Notes'}
                      </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 mt-2">
                      {/* Answer details */}
                      <Card className="rounded-2xl border-border/60">
                        <CardHeader className="py-4">
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Legal Synthesis Answer
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/95">
                            {selectedSession.answer}
                          </p>
                        </CardContent>
                      </Card>

                      {/* AI study notes */}
                      <Card className="rounded-2xl border-border/60 bg-muted/5 relative overflow-hidden">
                        <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            Assisted Workspace Notes
                          </CardTitle>
                          {sessionNotes && (
                            <Button variant="ghost" size="icon" onClick={copyNotes} className="h-7 w-7">
                              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent>
                          {notesLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span className="text-[11px] text-muted-foreground">Processing workspace documents…</span>
                            </div>
                          ) : sessionNotes ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">
                              {sessionNotes}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                              <Sparkles className="h-6 w-6 mb-2 text-muted-foreground/40" />
                              <p className="text-xs">Click "Generate Study Notes" to summarize resources in this workspace.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sources retrieved */}
                    <div className="mt-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Constitutional Sources &amp; Match Index ({selectedSession.sources.length})
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedSession.sources.map((src, i) => (
                          <div key={i} className="glass p-4 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
                            {src.relevance_score !== undefined && (
                              <div className="absolute top-0 left-0 right-0 h-[2px] bg-muted-foreground/10">
                                <div className="h-full bg-emerald-500" style={{ width: `${src.relevance_score * 100}%` }} />
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Article {src.article_number || src.primary_article || 'General'}
                              </span>
                              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                                Match: {src.relevance_score ? `${Math.round(src.relevance_score * 100)}%` : 'Vector'}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-foreground leading-snug">
                              Constitution of India • Page {src.page || '?'}
                            </p>
                            <p className="text-[10px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                              {src.snippet || src.content_preview}
                            </p>
                            {(src.article_number || src.primary_article) && (
                              <div className="mt-1">
                                <KnowledgeClusterBadge article={src.article_number || src.primary_article} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
                  <ArrowRight className="h-8 w-8 mb-2 animate-bounce-horizontal text-muted-foreground/30" />
                  <p className="text-xs">Select a research session from the panel to inspect documents and workspace notes.</p>
                </div>
              )}
            </div>

            {/* ── Floating '+' button ── */}
            <button
              onClick={() => setShowNewNote(true)}
              className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
              aria-label="Create note or upload document"
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* ── Slide-up drawer/overlay ── */}
            {showNewNote && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
                  onClick={() => setShowNewNote(false)}
                />
                {/* Panel */}
                <div className="fixed bottom-0 left-0 right-0 z-50 md:right-6 md:left-auto md:bottom-24 md:w-[420px] animate-in slide-in-from-bottom-4 duration-300">
                  <Card className="rounded-t-2xl md:rounded-2xl border-border/60 shadow-xl p-5">
                    <NoteUploadPanel onClose={() => setShowNewNote(false)} />
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
