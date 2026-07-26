import type { Citation } from '@/components/nyaya/citation-card';

export interface LegalAnswer {
  content: string;
  citations: Citation[];
}

const knowledgeBase: Record<string, LegalAnswer> = {
  rti: {
    content:
      'Under the Right to Information Act, 2005, any Indian citizen can request information from public authorities. The application must be in writing, accompanied by a fee of ₹10 (₹2 for BPL applicants), and the authority must respond within 30 days (48 hours if life or liberty is at stake). You can use the RTI Generator to draft a compliant application automatically.',
    citations: [
      { id: 'c1', title: 'Right to Information Act, 2005', source: 'Bare Act', section: 'Section 6 — Request for obtaining information', type: 'act' },
      { id: 'c2', title: 'Section 7 — Disposal of request', source: 'Bare Act', section: '30-day response window', type: 'act' },
      { id: 'c3', title: 'CIC guidelines on RTI fees', source: 'cic.gov.in', type: 'article' },
    ],
  },
  'legal notice': {
    content:
      'A legal notice is a formal communication sent before initiating litigation, signalling your intention to take legal action. Under Section 80 of the Code of Civil Procedure, a 60-day notice is mandatory before suing the government. For private parties, while not always mandatory, it strengthens your case and often leads to out-of-court settlement. The Legal Notice Generator will help you draft a precise, jurisdiction-ready notice.',
    citations: [
      { id: 'c1', title: 'Code of Civil Procedure, 1908', source: 'Bare Act', section: 'Section 80 — Notice before suit', type: 'act' },
      { id: 'c2', title: 'Skylab Associates v. M. V. Steelage', source: 'Supreme Court', type: 'case' },
    ],
  },
  'consumer rights': {
    content:
      'The Consumer Protection Act, 2019 grants you the right to seek redressal against defective goods, deficient services, unfair trade practices, and misleading advertisements. You can file a complaint with the District Consumer Disputes Redressal Forum (value up to ₹1 crore), State Commission (₹1–10 crore), or National Commission (above ₹10 crore). E-daakhil allows online filing.',
    citations: [
      { id: 'c1', title: 'Consumer Protection Act, 2019', source: 'Bare Act', section: 'Section 35 — Complaint', type: 'act' },
      { id: 'c2', title: 'E-daakhil portal', source: 'edaakhil.nic.in', type: 'article' },
    ],
  },
  default: {
    content:
      'I can help you understand Indian law, draft RTI applications, generate legal notices, explain your rights, and summarise case law. For the most accurate guidance, share the specific situation — parties involved, jurisdiction, and the relief you want. Note: I provide legal information, not a lawyer-client relationship; for court representation consult an advocate.',
    citations: [
      { id: 'c1', title: 'Advocates Act, 1961', source: 'Bare Act', section: 'Section 30 — Right to practise', type: 'act' },
      { id: 'c2', title: 'Bar Council of India guidelines', source: 'barcouncilofindia.org.in', type: 'article' },
    ],
  },
};

export function getLegalAnswer(query: string): LegalAnswer {
  const q = query.toLowerCase();
  if (q.includes('rti') || q.includes('right to information')) return knowledgeBase.rti;
  if (q.includes('legal notice') || q.includes('notice')) return knowledgeBase['legal notice'];
  if (q.includes('consumer') || q.includes('refund') || q.includes('defective')) return knowledgeBase['consumer rights'];
  return knowledgeBase.default;
}

export const suggestedPrompts = [
  'How do I file an RTI application?',
  'Explain my rights as a consumer for a refund',
  'Draft a legal notice for non-payment of dues',
  'What is the procedure for filing a cheque bounce case?',
  'Summarise the law on workplace harassment',
  'How does tenancy law protect a tenant from eviction?',
];

export const demoCitations: Citation[] = knowledgeBase.rti.citations;
