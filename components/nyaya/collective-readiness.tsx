import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Users, FileText } from 'lucide-react';

export function CollectiveReadiness({ data }: { data: any }) {
  const requirements = data?.requirements || [
    { name: 'Minimum Members Reached', met: true, required: 10, current: 15 },
    { name: 'Evidence Consolidated', met: true },
    { name: 'Representative Selected', met: false },
    { name: 'Legal Strategy Defined', met: true },
  ];

  const metCount = requirements.filter((r: any) => r.met).length;
  const total = requirements.length;
  const percentage = Math.round((metCount / total) * 100) || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Collective Action Readiness
        </CardTitle>
        <CardDescription>
          Track the requirements for proceeding with this collective action.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Overall Readiness</span>
            <span className="text-muted-foreground">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Requirements Checklist</h4>
          <div className="grid gap-2">
            {requirements.map((req: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground">
                <div className="flex items-center gap-3">
                  {req.met ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`font-medium ${req.met ? '' : 'text-muted-foreground'}`}>
                    {req.name}
                  </span>
                </div>
                {req.required !== undefined && (
                  <span className="text-xs font-semibold bg-muted px-2 py-1 rounded-md">
                    {req.current} / {req.required}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
