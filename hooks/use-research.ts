'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export interface ResearchSession {
  id: string;
  query: string;
  answer: string;
  detected_language: string;
  sources: any[];
  articles_retrieved: string[];
  created_at: string;
}

export function useResearch() {
  const [sessions, setSessions] = React.useState<ResearchSession[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSessions = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('research_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Supabase Notice] research_sessions table not found in schema cache:', error.message);
        setSessions([]);
      } else {
        setSessions(data || []);
      }
    } catch (err: any) {
      console.warn('[Supabase Warning] Error fetching research sessions:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = async (query: string, answer: string, detectedLanguage: string, sources: any[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Extract unique articles retrieved
      const articles = Array.from(
        new Set(
          sources
            .map((s) => s.article_number || s.primary_article)
            .filter(Boolean)
        )
      ) as string[];

      const { data, error } = await supabase
        .from('research_sessions')
        .insert({
          user_id: user.id,
          query,
          answer,
          detected_language: detectedLanguage,
          sources,
          articles_retrieved: articles,
        })
        .select()
        .single();

      if (error) {
        console.warn('[Supabase Notice] Could not save to research_sessions:', error.message);
        return null;
      }

      // Log analytics query event
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_type: 'query',
        metadata: { query, detected_language: detectedLanguage, articles_count: articles.length }
      });

      setSessions((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.warn('[Supabase Warning] Error saving research session:', err);
      return null;
    }
  };

  const getAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch query events
      const { data: events, error: eErr } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user.id);

      if (eErr) throw eErr;

      // Aggregations
      const totalQueries = events?.filter(e => e.event_type === 'query').length || 0;
      
      const { data: notes, error: nErr } = await supabase
        .from('research_notes')
        .select('id')
        .eq('user_id', user.id);

      if (nErr) throw nErr;
      const totalSessions = sessions.length;

      // Collect topics
      const topicsMap: Record<string, number> = {};
      sessions.forEach(s => {
        s.articles_retrieved.forEach(art => {
          topicsMap[art] = (topicsMap[art] || 0) + 1;
        });
      });

      const popularTopics = Object.entries(topicsMap)
        .map(([topic, count]) => ({ topic: `Article ${topic}`, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalQueries,
        articlesRetrieved: Object.keys(topicsMap).length,
        researchSessions: totalSessions,
        generatedNotes: notes?.length || 0,
        popularTopics,
      };
    } catch (err) {
      console.error('Failed to aggregate analytics:', err);
      return null;
    }
  };

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    refetch: fetchSessions,
    saveSession,
    getAnalytics,
  };
}
