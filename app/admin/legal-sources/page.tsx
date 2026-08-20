import * as React from 'react';
import { AppShell } from '@/components/nyaya/app-shell';
import { ShieldCheck, Database, Search } from 'lucide-react';
import { LegalSourceTrust } from '@/components/nyaya/legal-source-trust';
import { LegalProvenance } from '@/components/nyaya/legal-provenance';
import { Button } from '@/components/ui/button';

export default function AdminLegalSourcesPage() {
  const sources = [
    {
      id: 1,
      title: "Bharatiya Nyaya Sanhita, 2023",
      status: "verified" as const,
      history: [
        { date: "Dec 25, 2023", action: "Assented by President", authority: "President of India" },
        { date: "Jul 1, 2024", action: "Came into force", authority: "Ministry of Home Affairs" }
      ]
    },
    {
      id: 2,
      title: "Indian Penal Code, 1860",
      status: "outdated" as const,
      history: [
        { date: "Oct 6, 1860", action: "Enacted", authority: "Governor-General in Council" },
        { date: "Jul 1, 2024", action: "Repealed and Replaced", authority: "Parliament of India" }
      ]
    },
    {
      id: 3,
      title: "Draft Digital Personal Data Protection Rules",
      status: "pending" as const,
      history: [
        { date: "Recent", action: "Draft published", authority: "MeitY" }
      ]
    }
  ];

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Source Verification Admin Portal
            </h1>
            <p className="text-muted-foreground mt-2">Manage and verify legal knowledge sources.</p>
          </div>
          <Button>Add New Source</Button>
        </div>

        <div className="grid gap-6">
          {sources.map(source => (
            <div key={source.id} className="border p-6 rounded-xl bg-card shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">{source.title}</h2>
                <LegalSourceTrust level={source.status} />
              </div>
              <LegalProvenance history={source.history} />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
