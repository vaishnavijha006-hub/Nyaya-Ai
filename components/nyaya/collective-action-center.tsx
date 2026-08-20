import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CollectiveActionCenter({ data, onJoin }: { data: any; onJoin: () => void }) {
  const activeCases = data?.cases || [
    { id: '1', title: 'Data Breach Privacy Violation', members: 124, status: 'Gathering Evidence' },
    { id: '2', title: 'Unfair Labor Practices', members: 45, status: 'Drafting Complaint' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Collective Action Center
        </CardTitle>
        <CardDescription>
          Discover and join collective actions for shared legal issues to strengthen your case.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="bg-amber-500/10 text-amber-600 p-3 rounded-md flex items-start gap-3 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            Joining a collective action can reduce legal costs and increase the strength of your claim by pooling evidence with others facing the same issue.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Suggested Actions for You</h4>
          
          {activeCases.map((c: any) => (
            <div key={c.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card hover:bg-muted/50 transition-colors">
              <div>
                <h5 className="font-semibold text-base">{c.title}</h5>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{c.members} affected members</span>
                  <span className="hidden sm:inline">•</span>
                  <Badge variant="outline">{c.status}</Badge>
                </div>
              </div>
              <Button onClick={() => onJoin()} className="w-full sm:w-auto shrink-0">
                Review & Join <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
