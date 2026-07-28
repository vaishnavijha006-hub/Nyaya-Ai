import type { Citation } from '@/components/nyaya/citation-card';

export interface LegalAnswer {
  content: string;
  citations: Citation[];
}

// ── Backend API call ──────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

export async function getLegalAnswer(query: string): Promise<LegalAnswer> {
  try {
    const res = await fetch(`${API_URL}/llm/rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: query }),
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status} ${res.statusText}`);
    }

    const data: { answer: string; sources: Array<{
      page: number | null;
      source: string | null;
      primary_article: string;
      article_refs: string;
      content_preview: string;
    }> } = await res.json();

    // Map backend sources → Citation objects for the UI
    const citations: Citation[] = data.sources
      .filter((s) => s.source)
      .map((s, i) => ({
        id: `c${i + 1}`,
        title: s.primary_article
          ? `Article ${s.primary_article} — Constitution of India`
          : `Constitution of India`,
        source: s.source ?? 'Constitution of India',
        section: s.primary_article
          ? `Article ${s.primary_article} | Page ${s.page ?? '?'}`
          : `Page ${s.page ?? '?'}`,
        type: 'act' as const,
      }));

    return { content: data.answer, citations };
  } catch (err) {
    console.error('[legal-engine] getLegalAnswer failed:', err);
    // Graceful fallback so the UI does not crash
    return {
      content:
        'Sorry, I could not reach the Nyaya AI backend. Please make sure the backend server is running at ' +
        API_URL,
      citations: [],
    };
  }
}

// ── Suggested prompts (used on the empty-state screen) ───────────────────────
export const suggestedPrompts = [
  'How do I file an RTI application?',
  'Explain my rights as a consumer for a refund',
  'Draft a legal notice for non-payment of dues',
  'What is the procedure for filing a cheque bounce case?',
  'Summarise the law on workplace harassment',
  'How does tenancy law protect a tenant from eviction?',
];

// ── Demo citations (kept for any component that imports it directly) ──────────
export const demoCitations: Citation[] = [
  {
    id: 'c1',
    title: 'Right to Information Act, 2005',
    source: 'Bare Act',
    section: 'Section 6 — Request for obtaining information',
    type: 'act',
  },
  {
    id: 'c2',
    title: 'Section 7 — Disposal of request',
    source: 'Bare Act',
    section: '30-day response window',
    type: 'act',
  },
];

