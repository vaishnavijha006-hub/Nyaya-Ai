'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase-client';
import { getLegalAnswer, type Audience } from '@/lib/legal-engine';
import type { Citation } from '@/components/nyaya/citation-card';
import type { SourceCitation } from '@/components/nyaya/source-card';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  sourceCitations?: SourceCitation[];
  pending?: boolean;
  detected_language?: string;
}

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Warning] Failed to fetch conversations:', error.message);
    } else if (data) {
      setConversations(data as Conversation[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return { conversations, loading, reload: load };
}

export function useConversation(conversationId: string | null) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, citations, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase Warning] Failed to fetch messages for conversation:', conversationId, error.message);
    } else if (data) {
      setMessages(
        (data as Array<{ id: string; role: 'user' | 'assistant'; content: string; citations: Citation[] | null }>).map(
          (m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            citations: m.citations ?? undefined,
          })
        )
      );
    }
    setLoading(false);
  }, [conversationId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const sendMessage = React.useCallback(
    async (text: string, audience: Audience = 'default') => {
      if (!conversationId || !text.trim()) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
      setMessages((m) => [...m, userMsg]);

      const { error: uErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: text,
      });
      if (uErr) {
        console.warn('[Supabase Warning] Failed to persist user message:', uErr.message);
      }

      const { error: cErr } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (cErr) {
        console.warn('[Supabase Warning] Failed to update conversation timestamp:', cErr.message);
      }

      const pendingId = crypto.randomUUID();
      setMessages((m) => [...m, { id: pendingId, role: 'assistant', content: '', pending: true }]);

      const answer = await getLegalAnswer(text, audience);

      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? {
                id: pendingId,
                role: 'assistant',
                content: answer.content,
                citations: answer.citations,
                sourceCitations: answer.sourceCitations,
                detected_language: answer.detected_language,
              }
            : msg
        )
      );

      const { error: aErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: answer.content,
        citations: answer.citations,
      });
      if (aErr) {
        console.warn('[Supabase Warning] Failed to persist assistant message:', aErr.message);
      }

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
    [conversationId]
  );

  const saveStreamedAnswer = React.useCallback(
    async (userText: string, assistantContent: string, citations: SourceCitation[]) => {
      if (!conversationId) return;

      const { error: uErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: userText,
      });
      if (uErr) {
        console.warn('[Supabase Warning] Failed to save user message in stream:', uErr.message);
      }

      const { error: aErr } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
        citations: citations,
      });
      if (aErr) {
        console.warn('[Supabase Warning] Failed to save assistant message in stream:', aErr.message);
      }

      const { error: cErr } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      if (cErr) {
        console.warn('[Supabase Warning] Failed to update conversation timestamp in stream:', cErr.message);
      }
    },
    [conversationId]
  );

  const addUserMessage = React.useCallback((text: string): string => {
    const id = crypto.randomUUID();
    const userMsg: ChatMessage = { id, role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    return id;
  }, []);

  return { messages, loading, sendMessage, saveStreamedAnswer, addUserMessage, reload: load };
}

export async function createConversation(title: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title })
    .select('id')
    .maybeSingle();

  if (error) {
    console.warn('[Supabase Warning] Failed to create conversation record:', error.message);
    return crypto.randomUUID();
  }
  return data?.id as string ?? crypto.randomUUID();
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from('conversations').delete().eq('id', id);
  if (error) {
    console.warn('[Supabase Warning] Failed to delete conversation record:', error.message);
  }
}

export async function renameConversation(id: string, title: string) {
  const { error } = await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) {
    console.warn('[Supabase Warning] Failed to rename conversation record:', error.message);
  }
}
