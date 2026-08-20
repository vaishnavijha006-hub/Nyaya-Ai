import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ShieldCheck, FileSignature } from 'lucide-react';

export function CollectiveConsent({ data, onAccept, onDecline }: { data: any; onAccept: (consentData: any) => void; onDecline: () => void }) {
  const [optInIdentity, setOptInIdentity] = useState(false);
  const [optInEvidence, setOptInEvidence] = useState(false);
  const [optInRepresentative, setOptInRepresentative] = useState(false);
  
  const canProceed = optInIdentity && optInEvidence;

  const handleAccept = () => {
    if (canProceed) {
      onAccept({
        optInIdentity,
        optInEvidence,
        optInRepresentative,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Collective Action Consent & Privacy
        </CardTitle>
        <CardDescription>
          Review and explicitly opt-in to participate in this collective legal action.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="bg-muted/50 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Action Summary</h4>
          <p className="text-sm text-muted-foreground mb-1"><strong>Case Type:</strong> {data?.caseType || 'Class Action'}</p>
          <p className="text-sm text-muted-foreground"><strong>Description:</strong> {data?.description || 'A group action addressing shared grievances.'}</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Required Consents
          </h4>
          
          <div className="flex items-start space-x-3 bg-background p-3 border rounded-md">
            <Checkbox 
              id="opt-identity" 
              checked={optInIdentity} 
              onCheckedChange={(c) => setOptInIdentity(c === true)} 
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="opt-identity" className="font-medium">
                Share my identity with the group
              </Label>
              <p className="text-sm text-muted-foreground">
                I agree to share my name and contact details with the verified collective group members and legal representatives.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-background p-3 border rounded-md">
            <Checkbox 
              id="opt-evidence" 
              checked={optInEvidence} 
              onCheckedChange={(c) => setOptInEvidence(c === true)} 
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="opt-evidence" className="font-medium">
                Consolidate my evidence
              </Label>
              <p className="text-sm text-muted-foreground">
                I allow my provided evidence and documentation to be aggregated with the collective claim.
              </p>
            </div>
          </div>
          
          <h4 className="font-semibold mt-4">Optional Consents</h4>
          <div className="flex items-start space-x-3 bg-background p-3 border rounded-md">
            <Checkbox 
              id="opt-rep" 
              checked={optInRepresentative} 
              onCheckedChange={(c) => setOptInRepresentative(c === true)} 
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="opt-rep" className="font-medium">
                Act as a lead representative
              </Label>
              <p className="text-sm text-muted-foreground">
                I am willing to be considered as a lead representative for this collective action, which may require additional time and public disclosure.
              </p>
            </div>
          </div>
        </div>

      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" onClick={onDecline}>Decline</Button>
        <Button onClick={handleAccept} disabled={!canProceed}>
          Provide Consent
        </Button>
      </CardFooter>
    </Card>
  );
}
