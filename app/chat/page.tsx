'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Trash2, Send, Mic, Paperclip, Sparkles, Search, X,
  Loader2, Square,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { AIResponseCard } from '@/components/nyaya/ai-response-card';
import { StreamingResponseCard } from '@/components/nyaya/streaming-response-card';
import { EmptyState } from '@/components/nyaya/empty-state';
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
  { value: 'default', label: 'Default' },
  { value: 'student', label: 'Student' },
  { value: 'lawyer', label: 'Lawyer' },
  { value: 'upsc', label: 'UPSC' },
  { value: 'child', label: 'Child' },
];

export default function ChatPage() {
  return (
    <AppShell>
      <ChatLayout />
    </AppShell>
  );
}

function ChatLayout() {
  const router = useRouter();
  const { conversations, loading: convsLoading, reload } = useConversations();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const { messages, loading: msgsLoading, sendMessage, addUserMessage, saveStreamedAnswer } = useConversation(activeId);

  const filtered = React.useMemo(
    () => conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  const startNew = async (): Promise<string | null> => {
    const id = await createConversation('New conversation');
    if (id) {
      setActiveId(id);
      reload();
      router.push('/chat');
      return id;
    } else {
      toast.error('Could not start a new conversation');
      return null;
    }
  };

  const onDelete = async (id: string) => {
    await deleteConversation(id);
    if (activeId === id) setActiveId(null);
    reload();
    toast.success('Conversation deleted');
  };

  return (
    <div className="flex h-screen">
      {/* Conversation history sidebar */}
      <div className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-muted/20 md:flex">
        <div className="flex h-16 items-center justify-between px-4">
          <h2 className="text-sm font-semibold">History</h2>
          <Button size="sm" variant="outline" onClick={startNew} className="h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
        <div className="px-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations"
              className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="mt-3 flex-1 px-3">
          {convsLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-8 text-center text-xs text-muted-foreground">
              {search ? 'No matches found' : 'No conversations yet'}
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
      </div>

      {/* Chat panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatPanel
          messages={messages}
          loading={msgsLoading}
          hasActive={!!activeId}
          onSend={sendMessage}
          onAddUserMessage={addUserMessage}
          onSaveStreamedAnswer={saveStreamedAnswer}
          onNew={startNew}
        />
      </div>
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
        'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-colors',
        active ? 'bg-primary/10' : 'hover:bg-accent/10'
      )}
      onClick={onClick}
    >
      <MessageSquare className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
      <span className={cn('min-w-0 flex-1 truncate text-sm', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
        {conversation.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="Delete conversation"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

function ChatPanel({
  messages, loading, hasActive, onSend, onAddUserMessage, onSaveStreamedAnswer, onNew,
}: {
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; citations?: any[]; sourceCitations?: any[]; detected_language?: string; pending?: boolean }>;
  loading: boolean;
  hasActive: boolean;
  onSend: (text: string, audience?: Audience) => void;
  onAddUserMessage: (text: string) => string;
  onSaveStreamedAnswer: (userText: string, assistantContent: string, citations: any[]) => Promise<void>;
  onNew: () => Promise<string | null>;
}) {
  const [input, setInput] = React.useState('');
  const [audience, setAudience] = React.useState<Audience>('default');
  const [listening, setListening] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [files, setFiles] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    const saved = window.localStorage.getItem('nyaya-audience') as Audience | null;
    if (saved && AUDIENCE_OPTIONS.some((option) => option.value === saved)) {
      setAudience(saved);
    }
  }, []);

  const updateAudience = (value: Audience) => {
    setAudience(value);
    window.localStorage.setItem('nyaya-audience', value);
  };

  const [streamingQuestion, setStreamingQuestion] = React.useState('');
  const { state: streamState, start: startStream, reset: resetStream } = useStreamingChat({
    question: streamingQuestion,
    audience,
  });
  const isStreamingActive = !!(streamingQuestion && !streamState.isDone);

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
    // Do NOT await — fire and forget so React can re-render with streaming updates
    startStream(trimmed);
    setInput('');
    setFiles([]);
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
          toast.error('No audio was recorded. Please try again.');
          return;
        }

        setTranscribing(true);
        try {
          const text = await transcribeAudio(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
          setInput((previous) => (previous ? `${previous} ${text}` : text));
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not transcribe the recording.');
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      setListening(true);
      toast.info('Recording started. Click the microphone again when you are done.');
    } catch (error) {
      setListening(false);
      const message = error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Microphone permission was denied. Allow microphone access and try again.'
        : 'Could not access the microphone.';
      toast.error(message);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).map((f) => f.name);
    if (list.length) {
      setFiles((prev) => [...prev, ...list]);
      toast.success(`Attached ${list.length} file${list.length > 1 ? 's' : ''}`);
    }
  };

  const isEmpty = !loading && messages.length === 0;

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">
              {hasActive ? 'Legal assistant' : 'Start a new conversation'}
            </p>
            <p className="text-xs text-muted-foreground">Cited answers · Indian law</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={audience} onValueChange={(value) => updateAudience(value as Audience)}>
            <SelectTrigger className="h-9 w-[124px] rounded-xl">
              <SelectValue aria-label="Audience" />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={onNew} className="md:hidden">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ))}
            </div>
          ) : isEmpty && !isStreamingActive ? (
            <EmptyState
              icon={Sparkles}
              title="Ask Nyaya anything about the law"
              description="Get cited answers, draft documents, or understand your rights. Try one of these prompts to begin."
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
                        startStream(p);
                      }}
                      className="glass rounded-xl px-3.5 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              }
            />
          ) : isEmpty && isStreamingActive ? (
            /* First message in a new conversation — show streaming card immediately */
            <div className="space-y-5">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-[15px] leading-relaxed text-primary-foreground">
                  {streamingQuestion}
                </div>
              </div>
              <StreamingResponseCard
                streamedText={streamState.streamedText}
                statusMessage={streamState.statusMessage}
                isStreaming={streamState.isStreaming}
                isDone={streamState.isDone}
                sourceCitations={streamState.sourceCitations}
                error={streamState.error}
                detectedLanguage={streamState.detectedLanguage}
              />
            </div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((m) =>
                  m.role === 'user' ? (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-[15px] leading-relaxed text-primary-foreground">
                        {m.content}
                      </div>
                    </motion.div>
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
              </AnimatePresence>

              {isStreamingActive && (
                <StreamingResponseCard
                  streamedText={streamState.streamedText}
                  statusMessage={streamState.statusMessage}
                  isStreaming={streamState.isStreaming}
                  isDone={streamState.isDone}
                  sourceCitations={streamState.sourceCitations}
                  error={streamState.error}
                  detectedLanguage={streamState.detectedLanguage}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Voice status banner — appears when recording or transcribing */}
      {(listening || transcribing) && (
        <div
          className={cn(
            'flex items-center justify-between border-t px-4 py-2 text-sm font-medium sm:px-6',
            listening
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-500'
              : 'border-primary/30 bg-primary/10 text-primary'
          )}
        >
          <span className="flex items-center gap-2">
            {listening ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                </span>
                Recording… click the mic to stop
              </>
            ) : (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Transcribing with Whisper…
              </>
            )}
          </span>
          {listening && (
            <button
              onClick={() => mediaRecorderRef.current?.stop()}
              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-border/60 bg-background/60 p-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs">
                  <Paperclip className="h-3 w-3" />
                  {f}
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove file">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="glass-strong flex items-end gap-2 rounded-2xl p-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              aria-label="Attach files"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Mic button — rich states: idle / recording / transcribing */}
            <div className="relative">
              {/* Pulsing ring when recording */}
              {listening && (
                <span className="absolute -inset-1.5 animate-ping rounded-full bg-rose-500/30" />
              )}
              <button
                onClick={toggleVoice}
                disabled={transcribing}
                title={listening ? 'Stop recording' : transcribing ? 'Transcribing…' : 'Record voice input (Speech-to-Text)'}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                  listening
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40'
                    : transcribing
                    ? 'cursor-not-allowed bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                )}
                aria-label={listening ? 'Stop voice recording' : transcribing ? 'Transcribing…' : 'Record voice input'}
              >
                {transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : listening ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>
            </div>

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
              placeholder={transcribing ? 'Transcribing your voice…' : 'Ask about your legal rights, draft a document…'}
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button
              onClick={submit}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Nyaya AI provides legal information, not legal advice. Always verify with a qualified advocate.
          </p>
        </div>
      </div>
    </>
  );
}
