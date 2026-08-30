'use client';

import * as React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Scale, 
  UserCheck, 
  MapPin, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Sparkles,
  HelpCircle,
  Building2,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaseDocumentVerifier, VerificationResult } from '@/components/nyaya/case-document-verifier';

export interface LegalJourneyData {
  case_summary: {
    category: string;
    sub_category?: string;
    issue: string;
    urgency: string;
  };
  document_analysis: {
    required_documents: { name: string; importance: string; description: string }[];
    verified_documents: { name: string; importance: string; description: string }[];
    missing_documents: { name: string; importance: string; description: string }[];
    all_documents_present: boolean;
  };
  legal_rights_and_judgments: {
    statutory_rights: { act: string; section: string; right_description: string }[];
    landmark_judgments: { case_name: string; court_year: string; key_ruling: string }[];
  };
  legal_aid_eval: {
    eligible: boolean;
    reasons: string[];
    message: string;
    next_steps: string[];
    threshold_note?: string;
  };
  nearest_dlsa: {
    found: boolean;
    state: string;
    slsa_name: string;
    slsa_portal: string;
    dlsa_name: string;
    address: string;
    phone: string;
    email: string;
    nalsa_helpline: string;
    nalsa_portal: string;
    how_to_apply: string[];
    how_to_apply_steps?: { step: number; title: string; description: string }[];
  };
  lawyer_network?: {
    suggested: boolean;
    title: string;
    message: string;
    specialization_needed: string;
    action_text: string;
    options: { name: string; experience: string; location: string }[];
  } | null;
}

export function EndToEndLegalJourney() {
  const [activeStep, setActiveStep] = React.useState<number>(1);
  const [problemText, setProblemText] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [journeyData, setJourneyData] = React.useState<LegalJourneyData | null>(null);

  // Profile Form for DLSA Legal Aid Check
  const [profile, setProfile] = React.useState({
    state: 'Delhi',
    district: 'Central',
    annual_income: 150000,
    gender: 'female',
    caste_category: 'general',
    disability: false,
  });

  const runFullJourneyAnalysis = async () => {
    if (!problemText.trim()) {
      toast.error('Please describe your legal problem first');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/legal-journey/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: problemText,
          user_profile: profile,
          uploaded_doc_names: [],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze legal journey');
      }

      const data = await res.json();
      if (data.success && data.journey) {
        setJourneyData(data.journey);
        setActiveStep(2);
        toast.success('Legal analysis complete — Required documents identified!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationDone = (verification: VerificationResult) => {
    toast.success(`Document verified: ${verification.document_type}`);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Nyaya AI — End-to-End Legal Assistant
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              State your problem → Identify & verify documents → Understand your rights & SC judgments → Check government legal aid & nearest DLSA office.
            </CardDescription>
          </div>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t text-xs font-semibold">
          {[
            { num: 1, label: '1. Problem Intake' },
            { num: 2, label: '2. Required Docs' },
            { num: 3, label: '3. Rights & Judgments' },
            { num: 4, label: '4. Legal Aid Check' },
            { num: 5, label: '5. Nearest DLSA' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => journeyData && setActiveStep(s.num)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                activeStep === s.num
                  ? 'bg-primary text-primary-foreground font-bold shadow'
                  : journeyData
                  ? 'bg-muted hover:bg-accent text-muted-foreground'
                  : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-background/20 text-center text-[11px] leading-5 font-bold">
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* STEP 1: Problem Intake */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Describe your legal problem in your own words</Label>
              <p className="text-xs text-muted-foreground">
                Example: "My landlord locked me out of my apartment without notice" or "My employer hasn't paid my 3 months salary"
              </p>
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Type your legal issue here..."
                rows={4}
                className="w-full p-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <Button
              onClick={runFullJourneyAnalysis}
              disabled={loading}
              className="w-full sm:w-auto gap-2 rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Legal Case & Laws...
                </>
              ) : (
                <>
                  Start End-to-End Legal Journey
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* STEP 2: Required Documents & Verification */}
        {activeStep === 2 && journeyData && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start justify-between">
              <div>
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                  Case Category: {journeyData.case_summary.category.replace(/_/g, ' ')}
                </Badge>
                <p className="text-sm font-medium mt-1">Issue: {journeyData.case_summary.issue}</p>
              </div>
            </div>

            {/* Required Documents Matrix */}
            <div className="space-y-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Required Case Documents & Evidence Matrix
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {journeyData.document_analysis.required_documents.map((doc, idx) => (
                  <div key={idx} className="p-3 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{doc.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          doc.importance === 'Mandatory'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }
                      >
                        {doc.importance}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Verifier Component */}
            <div className="pt-4 border-t">
              <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Verify Your Uploaded Case Documents
              </h3>
              <CaseDocumentVerifier
                caseInfo={journeyData.case_summary}
                onVerificationComplete={handleVerificationDone}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setActiveStep(3)} className="gap-2">
                Next: View Legal Rights & Judgments
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Statutory Rights & Landmark Judgments */}
        {activeStep === 3 && journeyData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                <Scale className="h-5 w-5" />
                Your Statutory Legal Rights under Indian Law
              </h3>
              <div className="grid grid-cols-1 gap-3 mt-3">
                {journeyData.legal_rights_and_judgments.statutory_rights.map((right, idx) => (
                  <div key={idx} className="p-4 rounded-xl border bg-card space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground">{right.act}</Badge>
                      <span className="font-bold text-sm">{right.section}</span>
                    </div>
                    <p className="text-sm text-foreground/90 mt-1">{right.right_description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                <BookOpen className="h-5 w-5" />
                Landmark Supreme Court & High Court Judgments
              </h3>
              <div className="grid grid-cols-1 gap-3 mt-3">
                {journeyData.legal_rights_and_judgments.landmark_judgments.map((j, idx) => (
                  <div key={idx} className="p-4 rounded-xl border bg-accent/10 border-accent/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{j.case_name}</span>
                      <Badge variant="outline" className="text-xs">{j.court_year}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Key Ruling: {j.key_ruling}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveStep(2)}>
                Back to Documents
              </Button>
              <Button onClick={() => setActiveStep(4)} className="gap-2">
                Next: Check Free Government Legal Aid
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Legal Aid Questionnaire */}
        {activeStep === 4 && journeyData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Section 12 Legal Services Authorities Act 1987 Evaluation
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Fill in your profile details to evaluate eligibility for free government legal aid.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">State</Label>
                <Input
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="e.g. Delhi, Uttar Pradesh"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">District</Label>
                <Input
                  value={profile.district}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                  placeholder="e.g. Central, Ghaziabad"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Annual Household Income (₹)</Label>
                <Input
                  type="number"
                  value={profile.annual_income}
                  onChange={(e) => setProfile({ ...profile, annual_income: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Gender</Label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full p-2 rounded-lg border bg-background text-sm"
                >
                  <option value="female font-medium">Female (Automatically Eligible)</option>
                  <option value="male">Male</option>
                  <option value="other">Other / Transgender</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Caste Category</Label>
                <select
                  value={profile.caste_category}
                  onChange={(e) => setProfile({ ...profile, caste_category: e.target.value })}
                  className="w-full p-2 rounded-lg border bg-background text-sm"
                >
                  <option value="general">General</option>
                  <option value="sc">Scheduled Caste (SC)</option>
                  <option value="st">Scheduled Tribe (ST)</option>
                  <option value="obc">OBC</option>
                </select>
              </div>

              <div className="space-y-1.5 flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="disability-chk"
                  checked={profile.disability}
                  onChange={(e) => setProfile({ ...profile, disability: e.target.checked })}
                  className="h-4 w-4 rounded border-primary"
                />
                <Label htmlFor="disability-chk" className="text-xs font-medium cursor-pointer">
                  Person with Disability
                </Label>
              </div>
            </div>

            <Button onClick={runFullJourneyAnalysis} className="w-full gap-2 rounded-xl">
              Re-calculate Government Legal Aid Eligibility
            </Button>

            {/* Results Box */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                journeyData.legal_aid_eval.eligible
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-amber-500/10 border-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {journeyData.legal_aid_eval.eligible ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                <span className="font-bold text-sm">
                  {journeyData.legal_aid_eval.eligible
                    ? 'Eligible for Free Government Legal Aid (DLSA)'
                    : 'May Not Qualify for Standard Free Legal Aid'}
                </span>
              </div>
              <p className="text-xs text-foreground/90">{journeyData.legal_aid_eval.message}</p>
              {journeyData.legal_aid_eval.reasons.length > 0 && (
                <div className="text-xs font-medium pt-1">
                  <span>Qualifying Criteria: </span>
                  <span className="text-emerald-700 font-semibold">
                    {journeyData.legal_aid_eval.reasons.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Lawyer Network Fallback Card for Ineligible Users */}
            {journeyData.lawyer_network && (
              <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-background dark:from-indigo-950/20 dark:via-purple-950/10 border-indigo-200 dark:border-indigo-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white font-semibold">
                    Legal Saathi Lawyer Network
                  </Badge>
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    {journeyData.lawyer_network.title}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  {journeyData.lawyer_network.message}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {journeyData.lawyer_network.options.map((opt, i) => (
                    <div key={i} className="p-2.5 rounded-lg border bg-card/80 text-xs flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-foreground">{opt.name}</span>
                        <p className="text-muted-foreground mt-0.5">{opt.experience} • {opt.location}</p>
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 text-[11px] h-7 gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                        {journeyData.lawyer_network?.action_text}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveStep(3)}>
                Back to Rights
              </Button>
              <Button onClick={() => setActiveStep(5)} className="gap-2">
                Next: View Nearest DLSA Office
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Nearest DLSA Office & Action Guide */}
        {activeStep === 5 && journeyData && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border bg-card shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Official DLSA Location
                  </Badge>
                  <h3 className="text-xl font-bold mt-1 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {journeyData.nearest_dlsa.dlsa_name}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-muted-foreground">Office Address</span>
                    <p className="font-medium text-foreground mt-0.5">{journeyData.nearest_dlsa.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-muted-foreground">Contact & National Helpline</span>
                    <p className="font-medium text-foreground mt-0.5">
                      Phone: {journeyData.nearest_dlsa.phone} | Helpline: {journeyData.nearest_dlsa.nalsa_helpline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Online Links */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={journeyData.nearest_dlsa.slsa_portal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Visit State Portal ({journeyData.nearest_dlsa.slsa_name})
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span>•</span>
                <a
                  href={journeyData.nearest_dlsa.nalsa_portal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Visit NALSA Portal (nalsa.gov.in)
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Step-by-step Interactive Legal Aid Roadmap */}
            <div className="p-5 rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/5 space-y-4">
              <h4 className="font-bold text-base text-primary flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Step-by-Step Guide to Claim Free Government Legal Aid
              </h4>

              {journeyData.nearest_dlsa.how_to_apply_steps ? (
                <div className="space-y-3 pt-1">
                  {journeyData.nearest_dlsa.how_to_apply_steps.map((st) => (
                    <div key={st.step} className="flex items-start gap-3 p-3 rounded-xl border bg-card/80 shadow-xs">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {st.step}
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-foreground">{st.title}</h5>
                        <p className="text-xs text-muted-foreground leading-relaxed">{st.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2 text-xs pl-2">
                  {journeyData.nearest_dlsa.how_to_apply.map((stepStr, idx) => (
                    <li key={idx} className="font-medium text-foreground/90 flex items-start gap-2">
                      <span className="font-bold text-primary">•</span>
                      <span>{stepStr}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveStep(4)}>
                Back to Eligibility
              </Button>
              <Button onClick={() => toast.success('Journey saved to your profile!')}>
                Save Case Journey
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
