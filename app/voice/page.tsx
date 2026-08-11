'use client';

import * as React from 'react';
import { AppShell } from '@/components/nyaya/app-shell';
import { VoicePanel } from '@/components/nyaya/voice-panel';
import { Mic, Volume2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type BackendStatus = 'checking' | 'online' | 'offline';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export default function VoicePage() {
  const router = useRouter();
  const [backendStatus, setBackendStatus] = React.useState<BackendStatus>('checking');

  const checkBackend = React.useCallback(async () => {
    setBackendStatus('checking');
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  }, []);

  React.useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const handleTranscribed = (text: string) => {
    // When STT completes, offer to send the text to the chat
    sessionStorage.setItem('nyaya-voice-query', text);
    // Small delay so user can see the transcript before redirecting
    setTimeout(() => router.push('/chat'), 2500);
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        {/* Page header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
            <Mic className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Voice Features</h1>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">
            Speak your legal question and get it transcribed, or hear any legal text read aloud using our neural Hindi voice model.
          </p>
        </div>

        {/* Feature badges */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Mic className="h-3 w-3" />
            OpenAI Whisper STT
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
            <Volume2 className="h-3 w-3" />
            Piper ONNX TTS
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            Hindi · English · Multilingual
          </span>
        </div>

        {/* Backend Status card */}
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-xl border p-3 ${
            backendStatus === 'online'
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : backendStatus === 'offline'
              ? 'border-rose-500/30 bg-rose-500/10'
              : 'border-border/60 bg-muted/10'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {backendStatus === 'checking' ? (
              <span className="flex h-2 w-2 rounded-full bg-muted-foreground/50 animate-pulse shrink-0" />
            ) : backendStatus === 'online' ? (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            ) : (
              <span className="flex h-2 w-2 rounded-full bg-rose-500 shrink-0" />
            )}
            <span
              className={`text-xs font-medium truncate ${
                backendStatus === 'online'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : backendStatus === 'offline'
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-muted-foreground'
              }`}
            >
              {backendStatus === 'checking'
                ? 'Checking voice backend…'
                : backendStatus === 'online'
                ? '✓ Voice backend online — STT & TTS ready'
                : '✗ Backend offline — start the FastAPI server on port 8000'}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={checkBackend}
            disabled={backendStatus === 'checking'}
            className="h-7 shrink-0 gap-1 text-xs px-2"
            aria-label="Retry backend check"
          >
            <RefreshCw className={`h-3 w-3 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>

        {/* Main panel */}
        <VoicePanel onTranscribed={handleTranscribed} />

        {/* Info note */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          After transcription, you will be redirected to the Chat page with your question pre-filled.
          The TTS voice model is Hindi (hi_IN-pratham-medium). Requires the backend server to be running on{' '}
          <code className="rounded bg-muted/60 px-1 py-0.5 font-mono">localhost:8000</code>.
        </p>
      </div>
    </AppShell>
  );
}
