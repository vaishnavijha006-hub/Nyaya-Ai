export interface DemoCaseData {
  id: string;
  title: string;
  category: string;
  complainant: string;
  respondent: string;
  jurisdiction: string;
  problemDescription: string;
  keyFacts: string[];
  documents: Array<{ name: string; type: string; status: 'VERIFIED' | 'UPLOADED' | 'NEEDS_REVIEW' | 'MISSING'; why: string }>;
  legalIssues: string[];
  plainExplanation: string;
  applicableLaw: string[];
  suggestedPathway: string;
  pathwayReasoning: string[];
  actions: Array<{ what: string; why: string; how: string; status: 'DONE' | 'CURRENT' | 'UPCOMING' }>;
  systemicPattern?: string;
  delayStats?: { hearings: number; adjournments: number; elapsedMonths: number; reason: string };
}

export class DemoCaseStore {
  static getDemoCases(): DemoCaseData[] {
    return [
      {
        id: 'demo-case-1',
        title: 'Tenant-Landlord Deposit Dispute',
        category: 'Property & Tenancy',
        complainant: 'Rohan Sharma (Tenant)',
        respondent: 'Anil Gupta (Landlord)',
        jurisdiction: 'Noida, Sector 62, Uttar Pradesh',
        problemDescription: 'My landlord locked me out upon lease expiry and refused to return my ₹60,000 security deposit, alleging unverified wall paint damage.',
        keyFacts: [
          'Lease agreement signed on 15 Jan 2025 for 11 months.',
          'Security deposit of ₹60,000 paid via UPI to landlord bank account.',
          '30-day written notice to vacate given via WhatsApp on 01 Nov 2025.',
          'Property handed over in clean condition on 15 Dec 2025.',
          'Landlord refused deposit return without providing itemized repair bills.',
        ],
        documents: [
          { name: 'Rent Agreement.pdf', type: 'Tenancy Contract', status: 'VERIFIED', why: 'Proves 11-month lease term & ₹60,000 deposit refund clause.' },
          { name: 'UPI Bank Statement.pdf', type: 'Payment Receipt', status: 'VERIFIED', why: 'Proves ₹60,000 transaction to landlord.' },
          { name: 'WhatsApp Vacate Notice.png', type: 'Communication', status: 'NEEDS_REVIEW', why: 'Confirms 30-day notice was delivered.' },
          { name: 'Formal Pre-Litigation Legal Notice', type: 'Legal Notice', status: 'MISSING', why: 'Required before court or tribunal filing.' },
        ],
        legalIssues: [
          'Unlawful withholding of refundable security deposit',
          'Breach of written tenancy agreement terms',
          'Absence of itemized repair invoices under Rent Control regulations',
        ],
        plainExplanation: 'In simple terms: Landlords cannot withhold security deposits without itemized receipts for actual damage. If you handed back the property peacefully, you are legally entitled to your deposit refund within 15 days.',
        applicableLaw: [
          'Transfer of Property Act, 1882 (Section 108 — Rights & Liabilities of Lessee)',
          'Indian Contract Act, 1872 (Section 73 — Breach of Contract & Remedies)',
          'Uttar Pradesh Urban Buildings Act, 1972 (Security Deposit Caps)',
        ],
        suggestedPathway: 'Pre-Litigation Settlement & Mediation (ADR)',
        pathwayReasoning: [
          'Dispute is document-supported (agreement + UPI transaction)',
          'Claim is purely monetary and negotiable outside court',
          'Can be resolved through DLSA Lok Adalat within 30 days',
        ],
        actions: [
          {
            what: 'Describe problem facts during intake',
            why: 'Extracts chronology and monetary claim details.',
            how: 'Completed during intake session.',
            status: 'DONE',
          },
          {
            what: 'Upload page 3 scan of tenancy agreement',
            why: 'Verifies specific deposit forfeiture clause.',
            how: 'Upload from Evidence section.',
            status: 'CURRENT',
          },
          {
            what: 'Draft 15-day pre-litigation Legal Notice',
            why: 'Establishes formal statutory demand before filing.',
            how: 'Use Nyaya Legal Notice Drafter tool.',
            status: 'UPCOMING',
          },
        ],
        systemicPattern: 'Recurring Rental Deposit Withholding Cluster in Noida Sector 62',
        delayStats: {
          hearings: 2,
          adjournments: 1,
          elapsedMonths: 3,
          reason: 'Landlord requested time to file written statement',
        },
      },
      {
        id: 'demo-case-2',
        title: 'Employment Salary & Notice Pay Recovery',
        category: 'Employment & Labor',
        complainant: 'Kavita Verma (Employee)',
        respondent: 'Apex Tech Solutions Pvt Ltd',
        jurisdiction: 'Bengaluru, Karnataka',
        problemDescription: 'Terminated without mandatory 30-day notice pay or pending salary for 2 months.',
        keyFacts: [
          'Employment offer letter signed on 01 Mar 2024.',
          'Salary of ₹75,000/month unpaid for Oct & Nov 2025.',
          'Termination letter issued effective immediately without severance.',
        ],
        documents: [
          { name: 'Offer Letter.pdf', type: 'Employment Contract', status: 'VERIFIED', why: 'Confirms 30-day notice pay obligation.' },
          { name: 'Bank Statement Oct-Nov.pdf', type: 'Bank Record', status: 'VERIFIED', why: 'Confirms zero salary credit for 2 months.' },
          { name: 'Termination Email.eml', type: 'Notice Letter', status: 'UPLOADED', why: 'Proves immediate termination without notice.' },
        ],
        legalIssues: [
          'Non-payment of earned wages under Industrial Disputes Act',
          'Breach of employment contract terms regarding severance pay',
        ],
        plainExplanation: 'In simple terms: Employers cannot terminate employees without paying earned salary or providing required notice pay unless gross misconduct is legally proven.',
        applicableLaw: [
          'Payment of Wages Act, 1936',
          'Industrial Disputes Act, 1947',
          'Karnataka Shops and Commercial Establishments Act',
        ],
        suggestedPathway: 'Labor Commissioner Grievance & Legal Aid',
        pathwayReasoning: [
          'Administrative remedy through Labor Conciliation Officer',
          'Fast-track dispute resolution without expensive civil litigation',
        ],
        actions: [
          {
            what: 'Submit wage claim to Labor Officer',
            why: 'Initiates official conciliation proceedings.',
            how: 'Use Nyaya Action Workspace.',
            status: 'CURRENT',
          },
        ],
      },
    ];
  }
}
