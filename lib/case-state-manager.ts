'use client';

export interface CaseFact {
  id: string;
  label: string;
  value: string;
  source: string;
  status: 'CONFIRMED' | 'USER_PROVIDED' | 'DOCUMENT_SUPPORTED' | 'NEEDS_REVIEW' | 'CONFLICTING';
}

export interface CaseDocumentState {
  id: string;
  name: string;
  type: string;
  status: 'MISSING' | 'UPLOADING' | 'UPLOADED' | 'PROCESSING' | 'VERIFIED' | 'NEEDS_HUMAN_REVIEW';
  uploadDate?: string;
}

export interface ActionStepState {
  id: string;
  title: string;
  description: string;
  status: 'DONE' | 'CURRENT' | 'UPCOMING';
  attribution: string;
}

export interface CanonicalCaseState {
  caseId: string;
  title: string;
  category: string;
  journeyStage: 'Problem' | 'Facts' | 'Evidence' | 'Legal Analysis' | 'Resolution Path' | 'Action' | 'Resolution';
  facts: CaseFact[];
  documents: CaseDocumentState[];
  actionSteps: ActionStepState[];
  resolutionStatus: string;
  lastUpdated: string;
}

const STORAGE_PREFIX = 'nyaya_case_state_';

export const DEFAULT_CANONICAL_CASE: CanonicalCaseState = {
  caseId: 'case-1',
  title: 'Unlawful Security Deposit Withholding Dispute',
  category: 'Tenant / Rent Control',
  journeyStage: 'Action',
  facts: [
    {
      id: 'f-1',
      label: 'Security Deposit Paid',
      value: '₹50,000',
      source: 'UPI Payment Receipt',
      status: 'CONFIRMED',
    },
    {
      id: 'f-2',
      label: 'Move-Out Date',
      value: '15 June 2025',
      source: 'User Statement',
      status: 'USER_PROVIDED',
    },
    {
      id: 'f-3',
      label: 'Landlord Name',
      value: 'Rakesh Kumar',
      source: 'Rent Agreement Contract',
      status: 'DOCUMENT_SUPPORTED',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Rent Agreement Contract.pdf',
      type: 'PDF Contract',
      status: 'VERIFIED',
      uploadDate: '15 Aug 2026',
    },
    {
      id: 'doc-2',
      name: 'UPI Deposit Receipt.pdf',
      type: 'Payment Proof',
      status: 'VERIFIED',
      uploadDate: '15 Aug 2026',
    },
  ],
  actionSteps: [
    {
      id: 'act-1',
      title: 'Review Extracted Dispute Facts',
      description: 'Confirm security deposit payment date & landlord details.',
      status: 'DONE',
      attribution: 'User Confirmed',
    },
    {
      id: 'act-2',
      title: 'Upload Supporting Lease Agreement',
      description: 'Rent agreement contract uploaded & verified by PIL parser.',
      status: 'DONE',
      attribution: 'Verified Document',
    },
    {
      id: 'act-3',
      title: 'Generate Pre-Litigation Settlement Notice',
      description: 'Formulate 15-day statutory pre-litigation settlement proposal.',
      status: 'CURRENT',
      attribution: 'AI-Generated Draft',
    },
    {
      id: 'act-4',
      title: 'Dispatch Notice to Opposite Party',
      description: 'Share notice with landlord via advocate or registered speed post.',
      status: 'UPCOMING',
      attribution: 'Advocate Action Required',
    },
  ],
  resolutionStatus: 'Active: Pre-Litigation Settlement Preparation',
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_EMPLOYMENT_CASE: CanonicalCaseState = {
  caseId: 'case-2',
  title: 'Employment Contract & Salary Claim',
  category: 'Employment & Labor',
  journeyStage: 'Evidence',
  facts: [
    {
      id: 'f-1',
      label: 'Monthly Unpaid Salary',
      value: '₹75,000 / month (2 Months)',
      source: 'Bank Statement & Offer Letter',
      status: 'CONFIRMED',
    },
    {
      id: 'f-2',
      label: 'Notice Pay Requirement',
      value: '30-Day Mandatory Notice Pay',
      source: 'Employment Contract',
      status: 'CONFIRMED',
    },
    {
      id: 'f-3',
      label: 'Employer Name',
      value: 'Apex Tech Solutions Pvt Ltd',
      source: 'Offer Letter',
      status: 'DOCUMENT_SUPPORTED',
    },
    {
      id: 'f-4',
      label: 'Termination Date',
      value: '15 Dec 2025',
      source: 'Termination Email',
      status: 'USER_PROVIDED',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      name: 'Offer Letter & Employment Contract.pdf',
      type: 'Employment Contract',
      status: 'VERIFIED',
      uploadDate: '10 Aug 2026',
    },
    {
      id: 'doc-2',
      name: 'Bank Statement (Oct-Nov).pdf',
      type: 'Payment Record',
      status: 'VERIFIED',
      uploadDate: '10 Aug 2026',
    },
    {
      id: 'doc-3',
      name: 'Termination Email.eml',
      type: 'Notice Letter',
      status: 'UPLOADED',
      uploadDate: '10 Aug 2026',
    },
  ],
  actionSteps: [
    {
      id: 'act-1',
      title: 'Review Extracted Dispute Facts',
      description: 'Confirm unpaid wages and contract notice pay terms.',
      status: 'DONE',
      attribution: 'User Confirmed',
    },
    {
      id: 'act-2',
      title: 'Upload Offer Letter & Bank Statements',
      description: 'Employment contract uploaded & verified by parser.',
      status: 'DONE',
      attribution: 'Verified Document',
    },
    {
      id: 'act-3',
      title: 'Generate Demand Notice for Salary & Severance',
      description: 'Formulate 15-day statutory demand under Payment of Wages Act.',
      status: 'CURRENT',
      attribution: 'AI-Generated Draft',
    },
    {
      id: 'act-4',
      title: 'Submit Wage Grievance to Labor Conciliation Officer',
      description: 'File Form K claim with Bengaluru Labor Officer.',
      status: 'UPCOMING',
      attribution: 'Labor Officer Action Required',
    },
  ],
  resolutionStatus: 'Active: Labor Conciliation & Wage Recovery',
  lastUpdated: new Date().toISOString(),
};

function getDefaultCaseState(caseId: string): CanonicalCaseState {
  const isEmp = caseId === 'case-2' || caseId === 'demo-case-2' || caseId.includes('2') || caseId.toLowerCase().includes('employment');
  const base = isEmp ? DEFAULT_EMPLOYMENT_CASE : DEFAULT_CANONICAL_CASE;
  return { ...base, caseId };
}

export function getCanonicalCaseState(caseId: string = 'case-1'): CanonicalCaseState {
  if (typeof window === 'undefined') return getDefaultCaseState(caseId);
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${caseId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[case-state-manager] Failed reading local storage:', e);
  }
  return getDefaultCaseState(caseId);
}

export function saveCanonicalCaseState(state: CanonicalCaseState): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = { ...state, lastUpdated: new Date().toISOString() };
    localStorage.setItem(`${STORAGE_PREFIX}${state.caseId}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nyaya:case_updated', { detail: updated }));
  } catch (e) {
    console.error('[case-state-manager] Failed saving local storage:', e);
  }
}

export function addFactWithDeduplication(caseId: string, newFact: Omit<CaseFact, 'id'>): CanonicalCaseState {
  const current = getCanonicalCaseState(caseId);
  const existingIdx = current.facts.findIndex(
    (f) => f.label.toLowerCase() === newFact.label.toLowerCase()
  );

  if (existingIdx >= 0) {
    // Update existing fact rather than creating a duplicate entry
    current.facts[existingIdx] = {
      ...current.facts[existingIdx],
      value: newFact.value,
      source: newFact.source,
      status: newFact.status,
    };
  } else {
    current.facts.push({
      ...newFact,
      id: `f-${Date.now()}`,
    });
  }

  saveCanonicalCaseState(current);
  return current;
}

export function updateActionStepStatus(
  caseId: string,
  actionId: string,
  newStatus: 'DONE' | 'CURRENT' | 'UPCOMING'
): CanonicalCaseState {
  const current = getCanonicalCaseState(caseId);
  const action = current.actionSteps.find((a) => a.id === actionId);
  if (action) {
    action.status = newStatus;
  } else {
    current.actionSteps.push({
      id: actionId,
      title: 'Custom Action Step',
      description: 'User initiated action step',
      status: newStatus,
      attribution: 'User Action',
    });
  }

  saveCanonicalCaseState(current);
  return current;
}
