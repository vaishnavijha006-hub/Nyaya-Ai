"""
live_judgments_scraper.py — Scrapes legal news feeds and vectorizes them into a live database.
Run this script periodically (e.g. via cron) to keep the RAG system updated with the latest judgments.
"""

import sys
import os
import logging
from pathlib import Path
import feedparser
from datetime import datetime
from bs4 import BeautifulSoup
from langchain_core.documents import Document

# Setup paths so it can import 'app'
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.rag.embedder import get_embeddings
from langchain_chroma import Chroma

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# URL of the legal RSS feed. Using LiveLaw's public feed as an example,
# or we can mock it if it's unavailable.
RSS_FEEDS = [
    "https://www.livelaw.in/rss/top-stories"
]

LIVE_DB_DIR = Path(__file__).resolve().parent.parent / "vector-db-live"

def clean_html(html_text: str) -> str:
    """Strip HTML tags from RSS summaries."""
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, "html.parser")
    return soup.get_text(separator=" ", strip=True)

def ingest_rss_feed():
    logger.info(f"Starting Live Judgments Scraper. Target DB: {LIVE_DB_DIR}")
    LIVE_DB_DIR.mkdir(exist_ok=True, parents=True)
    
    # Initialize the Chroma collection
    db = Chroma(
        persist_directory=str(LIVE_DB_DIR),
        embedding_function=get_embeddings(),
        collection_name="live_judgments"
    )

    # In production, check existing IDs to prevent duplicates.
    # For this script, we'll extract existing titles to do a basic deduplication.
    existing_docs = []
    try:
        # Chroma collection fetching is simple: if it's empty, it returns an empty list
        result = db.get()
        existing_titles = set(meta.get("title") for meta in result.get("metadatas", []) if meta)
    except Exception as e:
        logger.warning(f"Could not load existing metadata: {e}")
        existing_titles = set()

    new_documents = []

    for feed_url in RSS_FEEDS:
        logger.info(f"Fetching feed: {feed_url}")
        feed = feedparser.parse(feed_url)
        
        for entry in feed.entries[:20]:  # Limit to 20 most recent to save time
            title = entry.get('title', '')
            link = entry.get('link', '')
            published = entry.get('published', '')
            summary = clean_html(entry.get('summary', ''))
            
            if not title or title in existing_titles:
                continue
            
            # Create LangChain Document
            text_content = f"Title: {title}\nDate: {published}\nSummary: {summary}\nLink: {link}"
            
            doc = Document(
                page_content=text_content,
                metadata={
                    "title": title,
                    "date": published,
                    "link": link,
                    "source": "LiveLaw RSS",
                    "origin": "live_judgment"
                }
            )
            new_documents.append(doc)
    
    if new_documents:
        logger.info(f"Found {len(new_documents)} new judgments. Vectorizing and storing...")
        # If texts are long, we would chunk them using app.rag.splitter.
        # But RSS summaries are short, so we can embed them directly.
        db.add_documents(new_documents)
        logger.info("Successfully updated live_judgments collection.")
    else:
        logger.info("No new judgments found. Database is up to date.")

if __name__ == "__main__":
    ingest_rss_feed()
