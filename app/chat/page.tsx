'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MessageSquare, Trash2, Send, Mic, Paperclip, Sparkles, Search, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/nyaya/app-shell';
import { AIResponseCard } from '@/components/nyaya/ai-response-card';
import { EmptyState } from '@/components/nyaya/empty-state';
import { ThinkingPulse } from '@/components/nyaya/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useConversations, useConversation, createConversation, deleteConversation,
} from '@/hooks/use-conversations';
import { suggestedPrompts } from '@/lib/legal-engine';
import { cn } from '@/lib/utils';

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
  const { messages, loading: msgsLoading, sendMessage } = useConversation(activeId);

  const filtered = React.useMemo(
    () => conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())),
    [conversations, search]
  );

  const startNew = async () => {
    const id = await createConversation('New conversation');
    if (id) {
      setActiveId(id);
      reload();
      router.push('/chat');
    } else {
      toast.error('Could not start a new conversation');
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
  messages, loading, hasActive, onSend, onNew,
}: {
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; citations?: any[]; pending?: boolean }>;
  loading: boolean;
  hasActive: boolean;
  onSend: (text: string) => void;
  onNew: () => void;
}) {
  const [input, setInput] = React.useState('');
  const [listening, setListening] = React.useState(false);
  const [files, setFiles] = React.useState<string[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const submit = () => {
    if (!hasActive) {
      onNew();
      return;
    }
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    setFiles([]);
  };

  const toggleVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      toast.error('Voice input is not supported in this browser');
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      toast.error('Could not capture voice input');
    };
    rec.start();
    setListening(true);
    toast.info('Listening… speak your question');
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
        <Button size="sm" variant="outline" onClick={onNew} className="md:hidden">
          <Plus className="h-4 w-4" />
        </Button>
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
          ) : isEmpty ? (
            <EmptyState
              icon={Sparkles}
              title="Ask Nyaya anything about the law"
              description="Get cited answers, draft documents, or understand your rights. Try one of these prompts to begin."
              action={
                <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {suggestedPrompts.slice(0, 4).map((p) => (
                    <button
                      key={p}
                      onClick={() => (hasActive ? onSend(p) : (onNew(), setTimeout(() => onSend(p), 800)))}
                      className="glass rounded-xl px-3.5 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              }
            />
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
                  ) : m.pending ? (
                    <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-strong rounded-3xl p-5">
                      <ThinkingPulse />
                    </motion.div>
                  ) : (
                    <AIResponseCard
                      key={m.id}
                      response={{ id: m.id, content: m.content, citations: m.citations }}
                    />
                  )
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

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
            <button
              onClick={toggleVoice}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                listening ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
              )}
              aria-label="Voice input"
            >
              <Mic className={cn('h-5 w-5', listening && 'animate-pulse')} />
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
              placeholder="Ask about your legal rights, draft a document…"
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
