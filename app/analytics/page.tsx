'use client';

import * as React from 'react';
import { useResearch } from '@/hooks/use-research';
import { AppShell } from '@/components/nyaya/app-shell';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, TrendingUp, BarChart3, Database, FileSpreadsheet, Scale, AlertCircle, Globe } from 'lucide-react';
import { getClusterCategory } from '@/components/nyaya/knowledge-cluster-badge';

// Fallback styling configurations for clusters on charts
const clusterColorMap: Record<string, string> = {
  'Fundamental Rights': 'bg-purple-500',
  'Directive Principles': 'bg-blue-500',
  'Fundamental Duties': 'bg-emerald-500',
  'Judiciary': 'bg-amber-500',
  'Emergency Provisions': 'bg-rose-500',
  'Union & States': 'bg-sky-500',
  'General Provisions': 'bg-slate-500',
};

export default function AnalyticsPage() {
  const { sessions, loading, getAnalytics } = useResearch();
  const [stats, setStats] = React.useState<any>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      if (loading) return;
      setStatsLoading(true);
      const data = await getAnalytics();
      setStats(data);
      setStatsLoading(false);
    }
    loadStats();
  }, [sessions, loading]);

  // Aggregate Knowledge Cluster counts
  const clusterCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Fundamental Rights': 0,
      'Directive Principles': 0,
      'Fundamental Duties': 0,
      'Judiciary': 0,
      'Emergency Provisions': 0,
      'Union & States': 0,
      'General Provisions': 0,
    };

    sessions.forEach((s) => {
      s.articles_retrieved.forEach((art) => {
        const cat = getClusterCategory(art);
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .filter((item) => item.count > 0);
  }, [sessions]);

  // Aggregate languages
  const languageCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((s) => {
      const lang = s.detected_language || 'english';
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [sessions]);

  const totalArticlesCount = stats?.articlesRetrieved || 0;

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen flex-col overflow-y-auto bg-background p-6 gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Project Analytics
          </h1>
          <p className="text-xs text-muted-foreground">
            Operational dashboard tracking RAG query volume, retrieved articles, and knowledge clusters.
          </p>
        </div>

        {statsLoading || loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-2xl border-border/60">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Queries</p>
                    <p className="text-xl font-extrabold mt-0.5">{stats?.totalQueries || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Scale className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Articles Retrieved</p>
                    <p className="text-xl font-extrabold mt-0.5">{totalArticlesCount}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Research Sessions</p>
                    <p className="text-xl font-extrabold mt-0.5">{stats?.researchSessions || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes Generated</p>
                    <p className="text-xl font-extrabold mt-0.5">{stats?.generatedNotes || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/60">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                    <Globe className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Most Used Language</p>
                    <p className="text-xl font-extrabold mt-0.5 uppercase">
                      {languageCounts.sort((a, b) => b.count - a.count)[0]?.name || 'EN'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Frequently Asked Legal Topics */}
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
                  {stats?.popularTopics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs">
                      <AlertCircle className="h-5 w-5 mb-2 text-muted-foreground/30" />
                      No consultation history available yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats?.popularTopics.map((topic: any, idx: number) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-foreground">{topic.topic}</span>
                            <span className="text-muted-foreground">{topic.count} hits</span>
                          </div>
                          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent" 
                              style={{ width: `${(topic.count / stats.popularTopics[0].count) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Language Distribution */}
              <Card className="rounded-2xl border-border/60">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Multilingual Interface Usage</CardTitle>
                  <CardDescription className="text-[11px]">
                    Analysis of detected user input language distributions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {languageCounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs">
                      <AlertCircle className="h-5 w-5 mb-2 text-muted-foreground/30" />
                      No language metrics.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {languageCounts.map((lang) => (
                        <div key={lang.name} className="flex items-center justify-between text-xs">
                          <span className="font-semibold uppercase text-foreground/80">{lang.name}</span>
                          <span className="font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                            {lang.count} ({Math.round((lang.count / sessions.length) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Knowledge Clusters Breakdown */}
              <Card className="rounded-2xl border-border/60 md:col-span-3">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">iNSIGHTS Knowledge Cluster Breakdown</CardTitle>
                  <CardDescription className="text-[11px]">
                    Classification of retrieved legal references mapped to core constitutional chapters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clusterCounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs">
                      <AlertCircle className="h-5 w-5 mb-2 text-muted-foreground/30" />
                      Run chat queries to build constitutional reference clusters.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {clusterCounts.map((item) => {
                        const bgClass = clusterColorMap[item.name] || 'bg-slate-500';
                        return (
                          <div key={item.name} className="flex flex-col gap-1.5 p-4 rounded-2xl border border-border/60 bg-muted/5">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${bgClass}`} />
                              <span className="text-xs font-bold text-foreground/80">{item.name}</span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xs text-muted-foreground">Consulted Instances</span>
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
