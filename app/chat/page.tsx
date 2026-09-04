'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Trash2, Send, Mic, Paperclip, Sparkles, Search, X,
  Loader2, Square, FileDown, Layers, Scale, PanelRightOpen, ChevronRight, History
} from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { AIResponseCard } from '@/components/nyaya/ai-response-card';
import { StreamingResponseCard } from '@/components/nyaya/streaming-response-card';
import { CaseUnderstanding } from '@/components/nyaya/case-understanding';
import { SmartQuestion } from '@/components/nyaya/smart-question';
import { EmergencyMode } from '@/components/nyaya/emergency-mode';
import { EmptyState } from '@/components/nyaya/empty-state';
import { LegalSourceCard } from '@/components/nyaya/legal-source-card';
import { LegalAnalysis } from '@/components/nyaya/legal-analysis';
import { MemoryConflict } from '@/components/nyaya/memory-conflict';
import { NyayaPath } from '@/components/nyaya/nyaya-path';
import { CaseContextPanel } from '@/components/nyaya/case-context-panel';
import {
  JourneyProgressBar,
  DocumentRequestCard,
  DocumentVerificationCard,
  LegalAidEligibleCard,
  LawyerSuggestionCard,
  CaseAnalysisCard,
  ActionPlanCard,
} from '@/components/nyaya/legal-journey-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useConversations, useConversation, createConversation, deleteConversation,
} from '@/hooks/use-conversations';
import { useStreamingChat } from '@/hooks/use-streaming-chat';
import { suggestedPrompts } from '@/lib/legal-engine';
import type { Audience } from '@/lib/legal-engine';
import { transcribeAudio } from '@/lib/speech';
import { cn } from '@/lib/utils';

const AUDIENCE_OPTIONS: Array<{ value: Audience; label: string }> = [
  { value: 'default', label: 'Citizen View' },
  { value: 'student', label: 'Student View' },
  { value: 'lawyer', label: 'Advocate View' },
  { value: 'upsc', label: 'Public Official' },
];

const LANGUAGE_OPTIONS: Array<{ value: string; label: string; flag: string }> = [
  { value: 'auto', label: 'Auto-detect', flag: '🌐' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'hi', label: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { value: 'mr', label: 'Marathi (मराठी)', flag: '🇮🇳' },
  { value: 'ta', label: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { value: 'te', label: 'Telugu (తెలుగు)', flag: '🇮🇳' },
  { value: 'bn', label: 'Bengali (বাংলা)', flag: '🇮🇳' },
  { value: 'gu', label: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
  { value: 'kn', label: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
  { value: 'ml', label: 'Malayalam (മലയാളം)', flag: '🇮🇳' },
  { value: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' },
  { value: 'ur', label: 'Urdu (اردو)', flag: '🇮🇳' },
  { value: 'hinglish', label: 'Hinglish', flag: '🇮🇳' },
];

export default function ChatPage() {
  return (
    <AppShell>
      <React.Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
        <ChatLayout />
      </React.Suspense>
    </AppShell>
  );
}

function ChatLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { conversations, loading: convsLoading, reload } = useConversations();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [showHistorySidebar, setShowHistorySidebar] = React.useState(true);
  const [mobileContextOpen, setMobileContextOpen] = React.useState(false);

  const { messages, loading: msgsLoading, sendMessage, addUserMessage, saveStreamedAnswer } = useConversation(activeId);

  React.useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setActiveId(null);
      router.replace('/chat');
    }
  }, [searchParams, router]);

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const filtered = React.useMemo(
    () => safeConversations.filter((c) => c && c.title && c.title.toLowerCase().includes(search.toLowerCase())),
    [safeConversations, search]
  );

  const startNew = async (): Promise<string | null> => {
    const id = await createConversation('New Case Intake');
    if (id) {
      setActiveId(id);
      reload();
      router.push('/chat');
      return id;
    } else {
      toast.error('Could not start a new intake session');
      return null;
    }
  };

  const onDelete = async (id: string) => {
    await deleteConversation(id);
    if (activeId === id) setActiveId(null);
    reload();
    toast.success('Conversation removed');
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* LEFT: History Sidebar (Desktop) */}
      <AnimatePresence initial={false}>
        {showHistorySidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden shrink-0 flex-col border-r border-border/80 bg-card md:flex"
          >
            <div className="flex h-14 items-center justify-between px-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Case History</h2>
              </div>
              <Button size="sm" variant="outline" onClick={startNew} className="h-7 px-2.5 text-xs gap-1 rounded-lg">
                <Plus className="h-3.5 w-3.5" />
                New
              </Button>
            </div>
            <div className="p-3 border-b border-border/40">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cases..."
                  className="h-8 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Clear">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 px-2.5 py-2">
              {convsLoading ? (
                <div className="space-y-2 p-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-2 py-8 text-center text-xs text-muted-foreground">
                  {search ? 'No matches found' : 'No past legal cases recorded'}
                </div>
              ) : (
                <div className="space-y-1 pb-4">
                  {filtered.map((c) => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      active={c.id === activeId}
                      onClick={() => setActiveId(c.id)}
                      onDelete={() => onDelete(c.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTER & RIGHT Container */}
      <div className="flex min-w-0 flex-1">
        <ChatPanel
          messages={messages}
          loading={msgsLoading}
          hasActive={!!activeId}
          showHistorySidebar={showHistorySidebar}
          onToggleHistorySidebar={() => setShowHistorySidebar(prev => !prev)}
          onOpenMobileContext={() => setMobileContextOpen(true)}
          onSend={sendMessage}
          onAddUserMessage={addUserMessage}
          onSaveStreamedAnswer={saveStreamedAnswer}
          onNew={startNew}
        />
      </div>

      {/* Mobile Context Drawer Sheet */}
      <AnimatePresence>
        {mobileContextOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileContextOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] border-l border-border bg-card lg:hidden"
            >
              <MobileCaseContextWrapper onClose={() => setMobileContextOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConversationItem({
  conversation, active, onClick, onDelete,
}: {
  conversation: { id: string; title: string; updated_at: string };
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'group flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors text-xs',
        active
          ? 'bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold border border-amber-500/20'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      onClick={onClick}
    >
      <MessageSquare className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')} />
      <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="Delete case"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

function MobileCaseContextWrapper({ onClose }: { onClose: () => void }) {
  return <CaseContextPanel onCloseMobile={onClose} className="h-full w-full border-none" />;
}

function ChatPanel({
  messages, loading, hasActive, showHistorySidebar, onToggleHistorySidebar, onOpenMobileContext, onSend, onAddUserMessage, onSaveStreamedAnswer, onNew,
}: {
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; citations?: any[]; sourceCitations?: any[]; detected_language?: string; pending?: boolean }>;
  loading: boolean;
  hasActive: boolean;
  showHistorySidebar: boolean;
  onToggleHistorySidebar: () => void;
  onOpenMobileContext: () => void;
  onSend: (text: string, audience?: Audience) => void;
  onAddUserMessage: (text: string) => string;
  onSaveStreamedAnswer: (userText: string, assistantContent: string, citations: any[], detectedLanguage?: string) => Promise<void>;
  onNew: () => Promise<string | null>;
}) {
  const [input, setInput] = React.useState('');
  const [audience, setAudience] = React.useState<Audience>('default');
  const [language, setLanguage] = React.useState<string>('auto');
  const [listening, setListening] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [files, setFiles] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const searchParams = useSearchParams();

  const [streamingQuestion, setStreamingQuestion] = React.useState('');
  const { state: streamState, start: startStream, reset: resetStream, clearEmergency } = useStreamingChat({
    question: streamingQuestion,
    audience,
    language,
  });
  const isStreamingActive = !!(streamingQuestion && !streamState.isDone);

  // Auto-start prompt if query parameter `q` is passed from home page
  React.useEffect(() => {
    const queryPrompt = searchParams.get('q');
    if (queryPrompt && !streamingQuestion && messages.length === 0) {
      onNew().then(() => {
        onAddUserMessage(queryPrompt);
        resetStream();
        setStreamingQuestion(queryPrompt);
        startStream(queryPrompt, audience, language);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  React.useEffect(() => () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamState.streamedText]);

  React.useEffect(() => {
    if (streamState.isDone && streamingQuestion && streamState.streamedText) {
      onSaveStreamedAnswer(
        streamingQuestion,
        streamState.streamedText,
        streamState.sourceCitations,
        streamState.detectedLanguage,
      ).catch((e: unknown) => console.error('Failed to persist streamed answer:', e));

      const t = setTimeout(() => {
        resetStream();
        setStreamingQuestion('');
      }, 400);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamState.isDone]);

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!hasActive) {
      await onNew();
    }

    onAddUserMessage(trimmed);
    resetStream();
    setStreamingQuestion(trimmed);
    startStream(trimmed, audience, language);
    setInput('');
    setFiles([]);
  };

  const submitAnswer = async (answer: string) => {
    const trimmed = answer.trim();
    if (!trimmed) return;

    if (!hasActive) {
      await onNew();
    }

    onAddUserMessage(trimmed);
    resetStream();
    setStreamingQuestion(trimmed);
    startStream(trimmed, audience, language);
  };

  const toggleVoice = async (): Promise<void> => {
    if (listening) {
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        setListening(false);
        mediaRecorderRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;

        if (chunks.length === 0) {
          toast.error('No audio was recorded.');
          return;
        }

        setTranscribing(true);
        try {
          const text = await transcribeAudio(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
          setInput((previous) => (previous ? `${previous} ${text}` : text));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not transcribe recording.');
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      setListening(true);
      toast.info('Recording started. Click microphone again when done.');
    } catch (error) {
      setListening(false);
      toast.error('Could not access microphone.');
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (!selectedFiles.length) return;

    const names = selectedFiles.map((f) => f.name);
    setFiles((prev) => [...prev, ...names]);

    for (const file of selectedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('http://127.0.0.1:8000/cases/verify-document', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          toast.success(`Successfully uploaded & verified: ${file.name}`);
        } else {
          toast.info(`Attached document: ${file.name}`);
        }
      } catch (err) {
        toast.info(`Attached document: ${file.name}`);
      }
    }
  };

  const isEmpty = !loading && messages.length === 0;

  return (
    <div className="flex h-full w-full min-w-0">
      {/* CENTER: Main Chat Conversation Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/80 px-4 bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onToggleHistorySidebar}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted"
              title={showHistorySidebar ? 'Hide History' : 'Show History'}
            >
              <History className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                NYAYA AI — <span className="text-amber-700 dark:text-amber-400">Understanding your case</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Language Selector */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-8 w-[120px] rounded-lg border-border bg-background text-xs">
                <SelectValue aria-label="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    <span className="mr-1">{opt.flag}</span>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Audience Selector */}
            <Select value={audience} onValueChange={(val) => setAudience(val as Audience)}>
              <SelectTrigger className="h-8 w-[110px] rounded-lg border-border bg-background text-xs">
                <SelectValue aria-label="Audience" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Mobile Context Drawer Toggle Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenMobileContext}
              className="h-8 px-2 text-xs gap-1 font-semibold lg:hidden"
            >
              <Layers className="h-3.5 w-3.5 text-amber-600" />
              <span>Case Context</span>
            </Button>
          </div>
        </div>

        {/* Conversation Stream Scroll Area */}
        {streamState.isEmergency ? (
          <div className="flex-1 p-4 overflow-y-auto">
            <EmergencyMode onSafe={clearEmergency} />
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
            <div className="mx-auto w-full max-w-3xl space-y-5">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : isEmpty && !isStreamingActive ? (
                <EmptyState
                  icon={Scale}
                  title="Tell us what happened"
                  description="Describe your legal problem in plain words. Nyaya AI will help collect facts, verify documents, and guide you to the right pathway."
                  action={
                    <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                      {suggestedPrompts.slice(0, 4).map((p) => (
                        <button
                          key={p}
                          onClick={async () => {
                            if (!hasActive) await onNew();
                            onAddUserMessage(p);
                            resetStream();
                            setStreamingQuestion(p);
                            startStream(p, audience, language);
                          }}
                          className="legal-card p-3 text-left text-xs text-muted-foreground transition-colors hover:border-amber-500/50 hover:text-foreground"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {/* Case Created & Journey Feedback Banner */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>✓ Case Created &amp; Information Saved</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">Current Stage: Fact Extraction &amp; Intake</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Nyaya AI is analyzing your statements. Next: Upload relevant documents in the Evidence section or review initial legal analysis.
                    </p>
                    <div className="pt-1">
                      <NyayaPath currentStepIndex={1} variant="compact" />
                    </div>
                  </div>

                  {messages.map((m) =>
                    m.role === 'user' ? (
                      <div key={m.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-slate-900 text-slate-50 dark:bg-slate-800 dark:text-slate-100 px-4 py-3 text-xs leading-relaxed font-normal shadow-xs">
                          {m.content}
                        </div>
                      </div>
                    ) : m.pending ? null : (
                      <AIResponseCard
                        key={m.id}
                        response={{
                          id: m.id,
                          content: m.content,
                          citations: m.citations,
                          sourceCitations: m.sourceCitations,
                          detected_language: m.detected_language,
                        }}
                      />
                    )
                  )}

                  {isStreamingActive && (
                    <div className="space-y-4">
                      {streamState.caseClassification && (
                        <CaseUnderstanding data={streamState.caseClassification} />
                      )}
                      {streamState.documentRequest && (
                        <DocumentRequestCard
                          data={streamState.documentRequest}
                          onUploadClick={() => fileInputRef.current?.click()}
                        />
                      )}
                      {streamState.documentVerified && (
                        <DocumentVerificationCard data={streamState.documentVerified} />
                      )}
                      {streamState.legalAnalysis && (
                        <LegalAnalysis data={streamState.legalAnalysis} />
                      )}
                      {streamState.eligibilityQuestion && (
                        <SmartQuestion
                          questionId={streamState.eligibilityQuestion.question_id || 'eligibility'}
                          question={streamState.eligibilityQuestion.question || ''}
                          type={streamState.eligibilityQuestion.type || 'text'}
                          options={streamState.eligibilityQuestion.options}
                          onSubmit={submitAnswer}
                        />
                      )}
                      {streamState.legalAidEligible && (
                        <LegalAidEligibleCard data={streamState.legalAidEligible} />
                      )}
                      {streamState.legalAidIneligible && (
                        <LawyerSuggestionCard data={streamState.legalAidIneligible} />
                      )}
                      <StreamingResponseCard
                        streamedText={streamState.streamedText}
                        statusMessage={streamState.statusMessage}
                        isStreaming={streamState.isStreaming}
                        isDone={streamState.isDone}
                        sourceCitations={streamState.sourceCitations}
                        error={streamState.error}
                        detectedLanguage={streamState.detectedLanguage}
                      />
                      {streamState.caseAnalysis && (
                        <CaseAnalysisCard data={streamState.caseAnalysis} />
                      )}
                      {streamState.actionPlan && (
                        <ActionPlanCard data={streamState.actionPlan} />
                      )}
                      {streamState.followUpQuestions?.map((q: any, i: number) => (
                        <SmartQuestion
                          key={i}
                          questionId={`q-${i}`}
                          question={q.question || q.text || (typeof q === 'string' ? q : 'Follow up')}
                          type={q.type || 'text'}
                          options={q.options}
                          onSubmit={submitAnswer}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-border/80 bg-card p-3 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
                    <Paperclip className="h-3 w-3" />
                    {f}
                    <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-amber-500/50 shadow-xs">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Attach document"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={toggleVoice}
                disabled={transcribing}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  listening ? 'bg-rose-500 text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title={listening ? 'Stop recording' : 'Record voice'}
              >
                <Mic className="h-4 w-4" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                placeholder="Describe what happened..."
                className="flex-1 max-h-32 resize-none bg-transparent p-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />

              <Button
                type="button"
                onClick={submit}
                disabled={!input.trim()}
                size="sm"
                className="h-8 rounded-lg bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold px-3 text-xs"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Persistent Case Context Panel (Desktop) */}
      <div className="hidden lg:block w-80 shrink-0 h-full">
        <CaseContextPanel
          caseClassification={streamState.caseClassification}
          journeyStage={streamState.journeyStage}
          documentRequest={streamState.documentRequest}
          documentVerified={streamState.documentVerified}
          legalAnalysis={streamState.legalAnalysis}
          caseAnalysis={streamState.caseAnalysis}
          actionPlan={streamState.actionPlan}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
