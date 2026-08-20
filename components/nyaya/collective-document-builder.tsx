import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, PenTool } from 'lucide-react';

export function CollectiveDocumentBuilder({ draft, onApprove }: { draft: any; onApprove: () => void }) {
  const content = draft?.content || `
# CLASS ACTION COMPLAINT

## IN THE MATTER OF: Shared Grievance against [Defendant Name]

1. **JURISDICTION & VENUE**
   This action is brought on behalf of multiple plaintiffs who have suffered similar harm...

2. **NATURE OF THE ACTION**
   The collective seeks redress for systemic failures...

3. **THE PLAINTIFF CLASS**
   The class consists of all individuals who have submitted verified evidence...

4. **CAUSES OF ACTION**
   - Breach of Contract
   - Negligence
   - Consumer Protection Violations

5. **PRAYER FOR RELIEF**
   Wherefore, the Plaintiffs respectfully request that the Court grant...
  `;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          Collective Document Builder
        </CardTitle>
        <CardDescription>
          Drafting legal documents consolidating the collective claims and evidence.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md bg-muted/30">
          <ScrollArea className="h-[300px] w-full p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {content}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Draft
        </Button>
        <div className="space-x-2">
          <Button variant="secondary">
            <PenTool className="w-4 h-4 mr-2" />
            Request Edit
          </Button>
          <Button onClick={onApprove}>
            Approve Draft
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
