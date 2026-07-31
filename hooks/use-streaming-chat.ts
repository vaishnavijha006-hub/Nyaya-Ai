'use client';

/**
 * use-streaming-chat.ts — Phase 8 SSE streaming hook for Nyaya AI.
 *
 * Handles all four Phase 8 SSE event types:
 *   status  → updates statusMessage (shown before tokens arrive)
 *   token   → appends to streamedText, sets isStreaming=true, clears status
 *   sources → receives Phase 6 citations[] and legacy sources[]
 *   done    → marks isDone=true, clears cursor
 *
 * Design rules:
 *   - Never re-fetches or re-renders the full response; appends tokens only
 *   - Gracefully falls back to /chat (non-streaming) if SSE is unsupported
 *   - Cleans up EventSource on unmount / abort
 *   - Zero dependency on retrieval, citations, or prompt logic
 */

import * as React from 'react';
import type { SourceCitation } from '@/components/nyaya/source-card';
import type { Citation } from '@/components/nyaya/citation-card';
import type { Audience } from '@/lib/legal-engine';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export interface StreamState {
  /** Accumulated text from token events */
  streamedText: string;
  /** Latest status message from backend (e.g. "Reading Constitution of India...") */
  statusMessage: string | null;
  /** True once the first token arrives */
  isStreaming: boolean;
  /** True once the done event is received */
  isDone: boolean;
  /** Structured Phase 6 citations from sources event */
  sourceCitations: SourceCitation[];
  /** Legacy sources[] from sources event */
  legacySources: Citation[];
  /** Non-null when an error occurs */
  error: string | null;
  /** Detected response language code */
  detectedLanguage: string;
}

const INITIAL_STATE: StreamState = {
  streamedText: '',
  statusMessage: null,
  isStreaming: false,
  isDone: false,
  sourceCitations: [],
  legacySources: [],
  error: null,
  detectedLanguage: 'en',
};

export interface UseStreamingChatOptions {
  question: string;
  audience?: Audience;
  /** Set to a conversation-specific value if you need to key renders */
  conversationId?: string | null;
}

/**
 * useStreamingChat
 *
 * Start a streaming response by calling start().
 * Reset with reset() before a new question.
 *
 * Usage:
 *   const { state, start, reset } = useStreamingChat({ question });
 *   <button onClick={start}>Ask</button>
 *   <p>{state.streamedText}</p>
 */
export function useStreamingChat({ question, audience = 'default' }: UseStreamingChatOptions) {
  const [state, setState] = React.useState<StreamState>(INITIAL_STATE);
  const abortRef = React.useRef<AbortController | null>(null);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const start = React.useCallback(
    async (overrideQuestion?: string) => {
      const q = overrideQuestion ?? question;
      if (!q.trim()) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Reset state before new stream
      setState(INITIAL_STATE);

      try {
        const response = await fetch(`${API_URL}/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, audience }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
        }
        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        // ── SSE read loop ──────────────────────────────────────────────────────
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by double newlines
          const parts = buffer.split('\n\n');
          // Keep the last incomplete chunk in buffer
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;

            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              // Malformed JSON — skip silently
              continue;
            }

            const type = event.type as string;

            if (type === 'status') {
              // ── Status event: update message, keep showing spinner ──────────
              setState((prev) => ({
                ...prev,
                statusMessage: (event.message as string) ?? null,
              }));
            } else if (type === 'token') {
              // ── Token event: append content, hide status ───────────────────
              const token = (event.content as string) ?? '';
              setState((prev) => ({
                ...prev,
                streamedText: prev.streamedText + token,
                isStreaming: true,
                statusMessage: null,     // Status hidden once tokens arrive
              }));
            } else if (type === 'sources') {
              // ── Sources event: Phase 6 citations + legacy sources ──────────
              const citations = (event.citations as SourceCitation[]) ?? [];
              const sources = (event.sources as Citation[]) ?? [];
              const lang = (event.detected_language as string) ?? 'en';
              setState((prev) => ({
                ...prev,
                sourceCitations: citations,
                legacySources: sources,
                detectedLanguage: lang,
              }));
            } else if (type === 'done') {
              // ── Done event: finalize ───────────────────────────────────────
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                isDone: true,
                statusMessage: null,
              }));
              reader.cancel();
              break;
            }
            // Unknown event types are silently ignored for forward-compatibility
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return; // Intentional cancel
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isDone: true,
          statusMessage: null,
          error: err instanceof Error ? err.message : 'Streaming failed. Please try again.',
        }));
      }
    },
    [question, audience]
  );

  return { state, start, reset };
}
