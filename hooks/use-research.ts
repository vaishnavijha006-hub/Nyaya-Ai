'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase-client';

export interface ResearchSession {
  id: string;
  query: string;
  answer: string;
  detected_language: string;
  sources: any[];
  articles_retrieved: string[];
  created_at: string;
}

export interface AnalyticsSummary {
  totalQueries: number;
  articlesRetrieved: number;
  researchSessions: number;
  generatedNotes: number;
  popularTopics: Array<{ topic: string; count: number }>;
}

const DEFAULT_ANALYTICS: AnalyticsSummary = {
  totalQueries: 0,
  articlesRetrieved: 0,
  researchSessions: 0,
  generatedNotes: 0,
  popularTopics: [],
};

export function useResearch() {
  const [sessions, setSessions] = React.useState<ResearchSession[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSessions = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let queryBuilder = supabase
        .from('research_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (user?.id) {
        queryBuilder = queryBuilder.eq('user_id', user.id);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        // Table missing or schema error — fail gracefully without crashing
        console.warn('[Supabase Notice] research_sessions lookup notice:', error.message);
        setSessions([]);
      } else {
        setSessions(data || []);
      }
    } catch (err: any) {
      console.warn('[Supabase Warning] Error fetching research sessions:', err?.message || err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = async (query: string, answer: string, detectedLanguage: string, sources: any[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Extract unique articles retrieved
      const articles = Array.from(
        new Set(
          (sources || [])
            .map((s) => s.article_number || s.primary_article)
            .filter(Boolean)
        )
      ) as string[];

      const payload: Record<string, any> = {
        query,
        answer,
        detected_language: detectedLanguage || 'english',
        sources: sources || [],
        articles_retrieved: articles,
      };

      if (user?.id) {
        payload.user_id = user.id;
      }

      const { data, error } = await supabase
        .from('research_sessions')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn('[Supabase Notice] Could not save to research_sessions:', error.message);
      } else if (data) {
        setSessions((prev) => [data, ...prev]);
      }

      // Log analytics query event gracefully
      const eventPayload: Record<string, any> = {
        event_type: 'query',
        metadata: { query, detected_language: detectedLanguage, articles_count: articles.length },
      };
      if (user?.id) {
        eventPayload.user_id = user.id;
      }

      const { error: analyticsErr } = await supabase
        .from('analytics_events')
        .insert(eventPayload);

      if (analyticsErr) {
        console.warn('[Supabase Notice] Could not log analytics_event:', analyticsErr.message);
      }

      return data || null;
    } catch (err) {
      console.warn('[Supabase Warning] Error saving research session:', err);
      return null;
    }
  };

  const getAnalytics = async (): Promise<AnalyticsSummary> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch query events gracefully
      let eventsQuery = supabase
        .from('analytics_events')
        .select('*');

      if (user?.id) {
        eventsQuery = eventsQuery.eq('user_id', user.id);
      }

      const { data: events, error: eErr } = await eventsQuery;

      if (eErr) {
        console.warn('[Supabase Notice] analytics_events query notice:', eErr.message);
      }

      // Aggregations
      const totalQueries = events ? events.filter((e) => e.event_type === 'query').length : 0;

      // Fetch research notes gracefully
      let notesQuery = supabase
        .from('research_notes')
        .select('id');

      if (user?.id) {
        notesQuery = notesQuery.eq('user_id', user.id);
      }

      const { data: notes, error: nErr } = await notesQuery;

      if (nErr) {
        console.warn('[Supabase Notice] research_notes query notice:', nErr.message);
      }

      const totalSessions = sessions.length;

      // Collect topics
      const topicsMap: Record<string, number> = {};
      sessions.forEach((s) => {
        (s.articles_retrieved || []).forEach((art) => {
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
        generatedNotes: notes ? notes.length : 0,
        popularTopics,
      };
    } catch (err) {
      console.warn('[Supabase Notice] Failed to aggregate analytics, returning default state:', err);
      return DEFAULT_ANALYTICS;
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
