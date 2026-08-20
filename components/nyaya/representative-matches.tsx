import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, Star, Scale } from 'lucide-react';

export function RepresentativeMatches({ matches, onSelect }: { matches: any[]; onSelect: (id: string) => void }) {
  const displayMatches = matches?.length > 0 ? matches : [
    { id: '1', name: 'Aarav Patel', score: 98, role: 'Lead Plaintiff Candidate', experience: 'Previous experience in class action suits.' },
    { id: '2', name: 'Priya Sharma', score: 91, role: 'Co-Representative Candidate', experience: 'Strong documentation and evidence.' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Representative Matches
        </CardTitle>
        <CardDescription>
          Potential lead representatives for this collective action based on their case strength and willingness.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {displayMatches.map((match) => (
            <div key={match.id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg bg-card gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg">{match.name}</h4>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Match: {match.score}%
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Scale className="w-4 h-4" />
                  {match.role}
                </div>
                <p className="text-sm">{match.experience}</p>
              </div>
              <div className="flex items-center sm:items-start">
                <Button onClick={() => onSelect(match.id)} variant="outline" className="w-full sm:w-auto">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Support
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
