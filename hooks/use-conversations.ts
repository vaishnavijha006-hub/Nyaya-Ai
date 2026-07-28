'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase-client';
import { getLegalAnswer } from '@/lib/legal-engine';
import type { Citation } from '@/components/nyaya/citation-card';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  pending?: boolean;
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
    if (!error && data) setConversations(data as Conversation[]);
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
    if (!error && data) {
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
    async (text: string) => {
      if (!conversationId || !text.trim()) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
      setMessages((m) => [...m, userMsg]);

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: text,
      });
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      const pendingId = crypto.randomUUID();
      setMessages((m) => [...m, { id: pendingId, role: 'assistant', content: '', pending: true }]);

      // Call the real FastAPI backend (async)
      const answer = await getLegalAnswer(text);

      // Save RAG response as a Research Session inside iNSIGHTS Assisted workspace
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Dynamic import or local function calls from useResearch
          const articles = Array.from(
            new Set(
              (answer.citations || [])
                .map((c) => c.article_number)
                .filter(Boolean)
            )
          ) as string[];

          await supabase.from('research_sessions').insert({
            user_id: user.id,
            query: text,
            answer: answer.content,
            detected_language: answer.detected_language || 'english',
            sources: answer.citations || [],
            articles_retrieved: articles,
          });

          await supabase.from('analytics_events').insert({
            user_id: user.id,
            event_type: 'query',
            metadata: { query: text, detected_language: answer.detected_language || 'english', articles_count: articles.length }
          });
        }
      } catch (saveErr) {
        console.error('Failed to log research session automatically:', saveErr);
      }

      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? { 
                id: pendingId, 
                role: 'assistant', 
                content: answer.content, 
                citations: answer.citations,
                detected_language: answer.detected_language 
              }
            : msg
        )
      );

      // Try auto-updating conversation title if it is "New Conversation" using first message
      try {
        const { data: conv } = await supabase
          .from('conversations')
          .select('title')
          .eq('id', conversationId)
          .single();
        if (conv && (conv.title === 'New Conversation' || conv.title === 'New chat')) {
          const generatedTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
          await supabase
            .from('conversations')
            .update({ title: generatedTitle })
            .eq('id', conversationId);
        }
      } catch (titleErr) {
        console.error('Failed to auto-update conversation title:', titleErr);
      }

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: answer.content,
        citations: answer.citations,
      });
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    },
    [conversationId]
  );

  return { messages, loading, sendMessage, reload: load };
}

export async function createConversation(title: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title })
    .select('id')
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}

export async function deleteConversation(id: string) {
  await supabase.from('conversations').delete().eq('id', id);
}

export async function renameConversation(id: string, title: string) {
  await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', id);
}
