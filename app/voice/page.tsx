'use client';

import { AppShell } from '@/components/nyaya/app-shell';
import { VoicePanel } from '@/components/nyaya/voice-panel';
import { Mic, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VoicePage() {
  const router = useRouter();

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
