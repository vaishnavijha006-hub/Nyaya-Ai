from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from app.services.llm import get_groq_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/research", tags=["research"])

class NotesRequest(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

class NotesResponse(BaseModel):
    notes: str

# Defined knowledge clusters
CLUSTERS = {
    "Fundamental Rights": (12, 35),
    "Directive Principles": (36, 51),
    "Fundamental Duties": (51, 51), # Explicit check for 51A in logic
    "Judiciary": (124, 147),
    "Emergency Provisions": (352, 360),
    "Union & States": (245, 263)
}

def determine_cluster(article_str: str) -> str:
    """Helper to categorize articles into logical constitutional clusters."""
    if not article_str:
        return "General Provisions"
    
    # Extract numerical part from article string (e.g., 'Article 21A' -> 21)
    nums = [int(s) for s in article_str.replace("A", "").replace("a", "").split() if s.isdigit()]
    if not nums:
        # Check if the string itself has a number inside
        import re
        match = re.search(r'\d+', article_str)
        if match:
            val = int(match.group())
        else:
            return "General Provisions"
    else:
        val = nums[0]

    # Specific check for Article 51A
    if "51A" in article_str.upper() or (val == 51 and "A" in article_str.upper()):
        return "Fundamental Duties"

    for cluster_name, (start, end) in CLUSTERS.items():
        if start <= val <= end:
            return cluster_name

    return "General Provisions"

@router.post("/notes/generate", response_model=NotesResponse)
async def generate_notes(request: NotesRequest):
    """
    Summarizes retrieved sources and the RAG answer into bullet-point AI Research Notes.
    Aligns with the iNSIGHTS workflow of organizing knowledge into workspaces.
    """
    client = get_groq_client()
    
    sources_text = ""
    for idx, src in enumerate(request.sources):
        art_ref = src.get("primary_article", "")
        page_ref = src.get("page", "")
        snippet = src.get("content_preview", "")
        sources_text += f"Source {idx+1}: Article {art_ref} (Page {page_ref})\nContent: {snippet}\n\n"

    prompt = (
        "You are an expert Constitutional Scholar assisting a legal researcher.\n"
        "Your task is to analyze the provided legal answer and its referenced constitutional articles, "
        "and produce a professional, structured set of 'AI Research Notes'.\n\n"
        "Instructions:\n"
        "1. Summarize the core constitutional findings in clear, concise bullet points.\n"
        "2. Detail the significance of each referenced article explicitly.\n"
        "3. Highlight key implications or legal boundaries mentioned in the text.\n"
        "4. Organize with clean Markdown headings.\n"
        "5. Respond in the same language as the legal answer if it is Hindi/Hinglish/Telugu/Tamil/Bengali.\n\n"
        f"--- LEGAL ANSWER ---\n{request.answer}\n\n"
        f"--- CONSTITUTIONAL SOURCES ---\n{sources_text}"
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a professional legal research assistant specializing in Indian Law."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1024
        )
        notes = response.choices[0].message.content
        return NotesResponse(notes=notes)
    except Exception as exc:
        logger.error(f"Failed to generate research notes: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to generate notes: {str(exc)}")

@router.get("/cluster")
async def get_clusters(articles: List[str] = Query(..., description="List of article numbers/labels")):
    """
    Returns mapped categories (knowledge clusters) for a list of articles.
    """
    results = {}
    for art in articles:
        results[art] = determine_cluster(art)
    return {"clusters": results}
