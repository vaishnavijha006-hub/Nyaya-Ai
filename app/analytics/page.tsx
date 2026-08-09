'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase-client';
import { AppShell } from '@/components/nyaya/app-shell';
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2, TrendingUp, BarChart3, Database, FileSpreadsheet,
  Scale, AlertCircle, Globe, MessageSquare, Languages, RefreshCw,
} from 'lucide-react';
import { getClusterCategory } from '@/components/nyaya/knowledge-cluster-badge';

// ── Language display names ──────────────────────────────────────────────────
const LANGUAGE_DISPLAY: Record<string, string> = {
  en:       'English',
  hi:       'Hindi',
  mr:       'Marathi',
  ta:       'Tamil',
  te:       'Telugu',
  bn:       'Bengali',
  gu:       'Gujarati',
  kn:       'Kannada',
  ml:       'Malayalam',
  pa:       'Punjabi',
  ur:       'Urdu',
  hinglish: 'Hinglish',
  auto:     'Auto-detect',
  english:  'English',
};

const LANGUAGE_FLAG: Record<string, string> = {
  en: '🇬🇧', hi: '🇮🇳', mr: '🇮🇳', ta: '🇮🇳', te: '🇮🇳',
  bn: '🇮🇳', gu: '🇮🇳', kn: '🇮🇳', ml: '🇮🇳', pa: '🇮🇳',
  ur: '🇮🇳', hinglish: '🇮🇳', english: '🇬🇧',
};

// ── Constitutional cluster colours ──────────────────────────────────────────
const CLUSTER_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'Fundamental Rights':    { bg: 'bg-purple-500/10',  text: 'text-purple-500',  bar: 'from-purple-500  to-purple-400'  },
  'Directive Principles':  { bg: 'bg-blue-500/10',    text: 'text-blue-500',    bar: 'from-blue-500    to-blue-400'    },
  'Fundamental Duties':    { bg: 'bg-emerald-500/10', text: 'text-emerald-500', bar: 'from-emerald-500 to-emerald-400' },
  'Judiciary':             { bg: 'bg-amber-500/10',   text: 'text-amber-500',   bar: 'from-amber-500   to-amber-400'   },
  'Emergency Provisions':  { bg: 'bg-rose-500/10',    text: 'text-rose-500',    bar: 'from-rose-500    to-rose-400'    },
  'Union & States':        { bg: 'bg-sky-500/10',     text: 'text-sky-500',     bar: 'from-sky-500     to-sky-400'     },
  'General Provisions':    { bg: 'bg-slate-500/10',   text: 'text-slate-500',   bar: 'from-slate-500   to-slate-400'   },
};

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  researchSessions: number;
  notesGenerated: number;
  mostUsedLanguage: string;
  popularTopics: Array<{ topic: string; count: number }>;
  languageCounts: Array<{ name: string; code: string; count: number; pct: number }>;
  clusterCounts: Array<{ name: string; count: number }>;
}

const EMPTY: AnalyticsData = {
  totalConversations: 0,
  totalMessages: 0,
  researchSessions: 0,
  notesGenerated: 0,
  mostUsedLanguage: 'EN',
  popularTopics: [],
  languageCounts: [],
  clusterCounts: [],
};

async function fetchAnalytics(): Promise<AnalyticsData> {
  const { data: { user } } = await supabase.auth.getUser();
  const uid = user?.id ?? null;

  // ── 1. Conversations count ─────────────────────────────────────────────────
  let convQuery = supabase.from('conversations').select('id', { count: 'exact', head: true });
  if (uid) convQuery = convQuery.eq('user_id', uid);
  const { count: totalConversations } = await convQuery;

  // ── 2. Messages count ──────────────────────────────────────────────────────
  const { count: totalMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'user');

  // ── 3. Research sessions ───────────────────────────────────────────────────
  let sessQuery = supabase
    .from('research_sessions')
    .select('id, articles_retrieved, detected_language');
  if (uid) sessQuery = sessQuery.eq('user_id', uid);
  const { data: sessions } = await sessQuery;

  const safeSessions = sessions ?? [];

  // ── 4. Notes generated ─────────────────────────────────────────────────────
  let notesQuery = supabase.from('research_notes').select('id', { count: 'exact', head: true });
  if (uid) notesQuery = notesQuery.eq('user_id', uid);
  const { count: notesGenerated } = await notesQuery;

  // ── 5. Analytics events → popular topics ──────────────────────────────────
  let evQuery = supabase.from('analytics_events').select('*');
  if (uid) evQuery = evQuery.eq('user_id', uid);
  const { data: events } = await evQuery;
  const safeEvents = events ?? [];

  // ── 6. Popular topics from research sessions articles ─────────────────────
  const topicsMap: Record<string, number> = {};
  safeSessions.forEach((s: any) => {
    (s.articles_retrieved ?? []).forEach((art: string) => {
      topicsMap[art] = (topicsMap[art] || 0) + 1;
    });
  });
  const popularTopics = Object.entries(topicsMap)
    .map(([art, count]) => ({ topic: `Article ${art}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ── 7. Language distribution from events + sessions ───────────────────────
  const langMap: Record<string, number> = {};
  safeSessions.forEach((s: any) => {
    const lang = (s.detected_language || 'en').toLowerCase();
    langMap[lang] = (langMap[lang] || 0) + 1;
  });
  safeEvents
    .filter((e: any) => e.event_type === 'query' && e.metadata?.detected_language)
    .forEach((e: any) => {
      const lang = e.metadata.detected_language.toLowerCase();
      langMap[lang] = (langMap[lang] || 0) + 1;
    });
  const totalLangCount = Object.values(langMap).reduce((a, b) => a + b, 0) || 1;
  const languageCounts = Object.entries(langMap)
    .map(([code, count]) => ({
      code,
      name: LANGUAGE_DISPLAY[code] ?? code.toUpperCase(),
      count,
      pct: Math.round((count / totalLangCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const mostUsedLanguage = languageCounts[0]
    ? (LANGUAGE_DISPLAY[languageCounts[0].code] ?? languageCounts[0].code.toUpperCase())
    : 'English';

  // ── 8. Knowledge cluster breakdown ────────────────────────────────────────
  const clusterMap: Record<string, number> = {
    'Fundamental Rights': 0,
    'Directive Principles': 0,
    'Fundamental Duties': 0,
    'Judiciary': 0,
    'Emergency Provisions': 0,
    'Union & States': 0,
    'General Provisions': 0,
  };
  safeSessions.forEach((s: any) => {
    (s.articles_retrieved ?? []).forEach((art: string) => {
      const cat = getClusterCategory(art);
      clusterMap[cat] = (clusterMap[cat] || 0) + 1;
    });
  });
  const clusterCounts = Object.entries(clusterMap)
    .map(([name, count]) => ({ name, count }))
    .filter((item) => item.count > 0);

  return {
    totalConversations: totalConversations ?? 0,
    totalMessages: totalMessages ?? 0,
    researchSessions: safeSessions.length,
    notesGenerated: notesGenerated ?? 0,
    mostUsedLanguage,
    popularTopics,
    languageCounts,
    clusterCounts,
  };
}

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData>(EMPTY);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Derive how many seconds ago the data was last updated
  const [, forceRender] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => forceRender(), 10_000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const secondsAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  const refresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAnalytics()
      .then((d) => { setData(d); setLastUpdated(new Date()); })
      .catch((err) => console.warn('[Analytics] Refresh failed:', err))
      .finally(() => setRefreshing(false));
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    fetchAnalytics()
      .then((d) => { setData(d); setLastUpdated(new Date()); })
      .catch((err) => {
        console.warn('[Analytics] Failed to load analytics:', err);
        setData(EMPTY);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Supabase Realtime subscriptions ──────────────────────────────────────
  React.useEffect(() => {
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'analytics_events' },
        () => fetchAnalytics().then((d) => { setData(d); setLastUpdated(new Date()); }),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'analytics_events' },
        () => fetchAnalytics().then((d) => { setData(d); setLastUpdated(new Date()); }),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'research_sessions' },
        () => fetchAnalytics().then((d) => { setData(d); setLastUpdated(new Date()); }),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'research_sessions' },
        () => fetchAnalytics().then((d) => { setData(d); setLastUpdated(new Date()); }),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        () => fetchAnalytics().then((d) => { setData(d); setLastUpdated(new Date()); }),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => fetchAnalytics().then((d) => { setData(d); setLastUpdated(new Date()); }),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen flex-col overflow-y-auto bg-background p-6 gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Project Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Operational dashboard tracking conversation volume, retrieved articles, language usage, and constitutional reference clusters.
            </p>
            {lastUpdated && (
              <p className="text-[10px] text-muted-foreground/60 mt-1 tabular-nums">
                Last updated:{' '}
                {secondsAgo !== null && secondsAgo < 60
                  ? `${secondsAgo}s ago`
                  : lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            disabled={refreshing}
            className="shrink-0 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs">Loading analytics…</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Stat Cards ──────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                icon={<MessageSquare className="h-5 w-5 text-primary" />}
                iconBg="bg-primary/10"
                label="Conversations"
                value={data.totalConversations}
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-violet-500" />}
                iconBg="bg-violet-500/10"
                label="Total Queries"
                value={data.totalMessages}
              />
              <StatCard
                icon={<Scale className="h-5 w-5 text-emerald-500" />}
                iconBg="bg-emerald-500/10"
                label="Articles Retrieved"
                value={data.researchSessions > 0
                  ? data.popularTopics.reduce((a, t) => a + t.count, 0)
                  : 0}
              />
              <StatCard
                icon={<Database className="h-5 w-5 text-blue-500" />}
                iconBg="bg-blue-500/10"
                label="Research Sessions"
                value={data.researchSessions}
              />
              <StatCard
                icon={<FileSpreadsheet className="h-5 w-5 text-amber-500" />}
                iconBg="bg-amber-500/10"
                label="Notes Generated"
                value={data.notesGenerated}
              />
            </div>

            {/* ── Most Used Language Highlight ─────────────────────────── */}
            <Card className="rounded-2xl border-border/60 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-11 w-11 bg-rose-500/10 rounded-xl flex items-center justify-center">
                  <Globe className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Most Used Language</p>
                  <p className="text-2xl font-extrabold mt-0.5">{data.mostUsedLanguage}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* ── Frequently Consulted Articles ─────────────────────── */}
              <Card className="rounded-2xl border-border/60 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Frequently Consulted Articles
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Top Constitution of India articles accessed by similarity queries.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.popularTopics.length === 0 ? (
                    <EmptyState label="No consultation history available yet." />
                  ) : (
                    <div className="space-y-4">
                      {data.popularTopics.map((topic, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-foreground">{topic.topic}</span>
                            <span className="text-muted-foreground">{topic.count} {topic.count === 1 ? 'hit' : 'hits'}</span>
                          </div>
                          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                              style={{ width: `${(topic.count / data.popularTopics[0].count) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Language Distribution ─────────────────────────────── */}
              <Card className="rounded-2xl border-border/60">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Languages className="h-4 w-4 text-primary" />
                    Multilingual Usage
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Detected user input language distributions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.languageCounts.length === 0 ? (
                    <EmptyState label="No language metrics yet. Start chatting to see data." />
                  ) : (
                    <div className="space-y-3">
                      {data.languageCounts.map((lang) => (
                        <div key={lang.code}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-foreground/80">
                              {LANGUAGE_FLAG[lang.code] ?? '🌐'} {lang.name}
                            </span>
                            <span className="text-muted-foreground font-mono">
                              {lang.count} ({lang.pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                              style={{ width: `${lang.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Knowledge Cluster Breakdown ───────────────────────── */}
              <Card className="rounded-2xl border-border/60 md:col-span-3">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-primary" />
                    Knowledge Cluster Breakdown
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Classification of retrieved legal references mapped to core constitutional chapters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.clusterCounts.length === 0 ? (
                    <EmptyState label="Run chat queries to build constitutional reference clusters." />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {data.clusterCounts.map((item) => {
                        const cfg = CLUSTER_COLORS[item.name] ?? {
                          bg: 'bg-slate-500/10',
                          text: 'text-slate-500',
                          bar: 'from-slate-500 to-slate-400',
                        };
                        const maxCount = Math.max(...data.clusterCounts.map((c) => c.count), 1);
                        return (
                          <div
                            key={item.name}
                            className={`flex flex-col gap-2 p-4 rounded-2xl border border-border/60 ${cfg.bg}`}
                          >
                            <p className={`text-xs font-bold ${cfg.text}`}>{item.name}</p>
                            <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full transition-all duration-700`}
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                              />
                            </div>
                            <div className="flex items-baseline justify-between mt-0.5">
                              <span className="text-[10px] text-muted-foreground">Consulted</span>
                              <span className="text-sm font-extrabold">{item.count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon, iconBg, label, value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
}) {
  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`h-10 w-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-xl font-extrabold mt-0.5 tabular-nums">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs gap-2">
      <AlertCircle className="h-5 w-5 text-muted-foreground/30" />
      {label}
    </div>
  );
}
