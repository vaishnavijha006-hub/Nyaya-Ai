'use client';

import * as React from 'react';
import { AppShell } from '@/components/nyaya/app-shell';
import { Search, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalSourceCard } from '@/components/nyaya/legal-source-card';
import { LegalVersionSelector, LegalVersion } from '@/components/nyaya/legal-version-selector';

export default function LawFinderPage() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [versionId, setVersionId] = React.useState('new');

  const versions: LegalVersion[] = [
    { id: 'new', name: 'Bharatiya Nyaya Sanhita (BNS)', year: '2023', status: 'active' },
    { id: 'old', name: 'Indian Penal Code (IPC)', year: '1860', status: 'repealed' },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    // Mock search for Indian Law Finder
    setTimeout(() => {
      setResults([
        {
          title: 'Constitution of India, Article 21',
          snippet: 'Protection of life and personal liberty. No person shall be deprived of his life or personal liberty except according to procedure established by law.',
          confidence: 98,
          trustLevel: 'verified',
          url: '#'
        },
        {
          title: 'Bharatiya Nyaya Sanhita, Section 3(5)',
          snippet: 'Joint criminal liability. When a criminal act is done by several persons in furtherance of the common intention of all, each of such persons is liable for that act in the same manner as if it were done by him alone.',
          confidence: 85,
          trustLevel: 'verified',
          url: '#'
        },
        {
          title: 'Information Technology Act, 2000, Section 66C',
          snippet: 'Punishment for identity theft. Whoever, fraudulently or dishonestly make use of the electronic signature, password or any other unique identification feature of any other person, shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine which may extend to rupees one lakh.',
          confidence: 72,
          url: '#'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <AppShell>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="border-b border-border/60 p-6 sm:p-10 bg-muted/20">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                <Book className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold">Indian Law Finder</h1>
            </div>
            <p className="text-muted-foreground text-sm">Search across Indian acts, sections, and case laws with semantic retrieval.</p>
            
            <div className="pt-2">
              <LegalVersionSelector 
                versions={versions} 
                currentVersionId={versionId} 
                onVersionSelect={setVersionId} 
              />
            </div>

            <div className="flex items-center gap-2 mt-4 bg-background rounded-xl p-2 border shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="h-5 w-5 text-muted-foreground ml-2 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for legal concepts, act names, or specific scenarios..."
                className="flex-1 bg-transparent border-none outline-none p-2 text-sm"
              />
              <Button onClick={handleSearch} disabled={loading || !query.trim()} className="rounded-lg px-6 font-medium">
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-background">
          <div className="max-w-3xl mx-auto w-full">
            {results.length > 0 ? (
              <div className="space-y-4 pb-20">
                <h2 className="text-lg font-semibold mb-6">Search Results</h2>
                <div className="space-y-4">
                  {results.map((r, i) => (
                    <LegalSourceCard key={i} source={r} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted-foreground py-20">
                <Book className="h-12 w-12 opacity-20 mb-4" />
                <p>Enter a query to search Indian legal sources</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
