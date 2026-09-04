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

export function getCanonicalCaseState(caseId: string = 'case-1'): CanonicalCaseState {
  if (typeof window === 'undefined') return DEFAULT_CANONICAL_CASE;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${caseId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[case-state-manager] Failed reading local storage:', e);
  }
  return { ...DEFAULT_CANONICAL_CASE, caseId };
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
