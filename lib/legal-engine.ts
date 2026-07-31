import type { Citation } from '@/components/nyaya/citation-card';
import type { SourceCitation } from '@/components/nyaya/source-card';

export interface LegalAnswer {
  content: string;
  /** Legacy citation format used by CitationCard (backward compat) */
  citations: Citation[];
  /** Phase 6 structured citations from backend citations[] field */
  sourceCitations: SourceCitation[];
  detected_language?: string;
}

export type Audience = 'default' | 'student' | 'lawyer' | 'upsc' | 'child';

// ── Backend API call ──────────────────────────────────────────────────────────
const API_URL = typeof window !== 'undefined' && 
  (window.location.hostname.includes('loca.lt') || window.location.hostname.includes('ngrok-free.dev'))
  ? 'https://populace-kisser-sandpit.ngrok-free.dev'
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000');

/** Phase 6 CitationItem shape returned by POST /chat */
interface BackendCitationItem {
  act_name: string;
  document_type: string;
  part?: string | null;
  chapter?: string | null;
  article?: string | null;
  section?: string | null;
  page?: number | null;
  confidence: number;
  chunk_id: string;
}

interface BackendSourceItem {
  page: number | null;
  source: string | null;
  primary_article: string;
  article_refs: string;
  content_preview: string;
  relevance_score?: number;
  origin?: string;
}

interface BackendChatResponse {
  answer: string;
  detected_language: string;
  response_language: string;
  sources: BackendSourceItem[];
  /** Phase 6 structured citations — may be absent on older backend */
  citations?: BackendCitationItem[];
  confidence_score?: number;
  retrieval_confidence?: number;
}

export async function getLegalAnswer(query: string, audience: Audience = 'default', language: string = 'auto'): Promise<LegalAnswer> {
  try {
    const res = await fetch(`${API_URL}/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: query, audience, language }),
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status} ${res.statusText}`);
    }

    const data: BackendChatResponse = await res.json();

    // ── Map backend sources → legacy Citation objects (CitationCard backward compat) ──
    const citations: Citation[] = (data.sources ?? [])
      .filter((s) => s.source)
      .map((s, i) => ({
        id: `c${i + 1}`,
        title: s.primary_article
          ? `Article ${s.primary_article} — ${s.source ?? 'Constitution of India'}`
          : (s.source ?? 'Constitution of India'),
        source: s.source ?? 'Constitution of India',
        section: s.primary_article
          ? `Article ${s.primary_article} | Page ${s.page ?? '?'}`
          : `Page ${s.page ?? '?'}`,
        type: 'article' as const,
        snippet: s.content_preview,
        page: s.page ?? undefined,
        article_number: s.primary_article || undefined,
        relevance_score: s.relevance_score ?? 0.85,
        origin: 'vector' as const,
      }));

    // ── Phase 6: map backend citations[] → SourceCitation objects ──
    const sourceCitations: SourceCitation[] = (data.citations ?? []).map((c) => ({
      act_name: c.act_name,
      document_type: c.document_type,
      part: c.part ?? null,
      chapter: c.chapter ?? null,
      article: c.article ?? null,
      section: c.section ?? null,
      page: c.page ?? null,
      confidence: c.confidence,
      chunk_id: c.chunk_id,
    }));

    return {
      content: data.answer,
      citations,
      sourceCitations,
      detected_language: data.detected_language,
    };
  } catch (err) {
    console.error('[legal-engine] getLegalAnswer failed:', err);
    return {
      content:
        'Sorry, I could not reach the Nyaya AI backend. Please make sure the backend server is running at ' +
        API_URL,
      citations: [],
      sourceCitations: [],
      detected_language: 'english',
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
