"""
ingest.py — Production Dual-Collection Ingestion & Manifest Management Module for Nyaya AI.

Features:
1. Multi-Collection Knowledge Base Architecture:
   - `knowledge-base/acts/*.pdf` -> `nyaya_constitution` (or `nyaya_acts`)
   - `knowledge-base/judgments/*.pdf` -> `nyaya_judgments`
   Judgments are NEVER mixed into the Acts collection.
2. Manifest System (`manifest.json`): Stores SHA256 hashes, timestamps, chunk counts, page counts.
3. Incremental Indexing: Skips unchanged PDFs; re-indexes modified/new PDFs.
4. Judgment Parser Integration (`judgment_parser.py`): Populates case_name, court, citation, bench, year, judges, holding metadata.
"""

import os
import sys
import json
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.rag.loader import load_pdf
from app.rag.splitter import split_documents
from app.rag.judgment_parser import parse_judgment_metadata
from app.rag.embedder import get_embeddings, DB_PATH, COLLECTION_NAME
from langchain_chroma import Chroma

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

KB_DIR = Path(__file__).parent / "knowledge-base"
ACTS_DIR = KB_DIR / "acts"
JUDGMENTS_DIR = KB_DIR / "judgments"
MANIFEST_PATH = KB_DIR / "manifest.json"

JUDGMENTS_COLLECTION_NAME = "nyaya_judgments"

# Act document type classifier
ACT_MAPPINGS = {
    "constitution_of_india.pdf": ("Constitution of India", "Constitution"),
    "bns.pdf": ("Bharatiya Nyaya Sanhita", "Act"),
    "bnss.pdf": ("Bharatiya Nagarik Suraksha Sanhita", "Act"),
    "bsa.pdf": ("Bharatiya Sakshya Adhiniyam", "Act"),
    "rti_act.pdf": ("Right to Information Act", "Act"),
    "consumer_protection_act.pdf": ("Consumer Protection Act", "Act"),
    "it_act.pdf": ("Information Technology Act", "Act"),
    "motor_vehicles_act.pdf": ("Motor Vehicles Act", "Act"),
}


def compute_sha256(filepath: Path) -> str:
    """Compute SHA256 hash of a file."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


def load_manifest() -> Dict[str, Any]:
    """Load or initialize manifest.json."""
    if MANIFEST_PATH.exists():
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"[LOAD] Error reading manifest.json: {e}")
    return {"manifest_version": 1, "last_updated": "", "documents": {}}


def save_manifest(manifest: Dict[str, Any]):
    """Save manifest.json."""
    manifest["last_updated"] = datetime.now().isoformat()
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    logger.info(f"[UPDATE] Manifest saved to {MANIFEST_PATH}")


def process_pdf_folder(
    folder_path: Path,
    collection_name: str,
    is_judgment: bool,
    indexed_docs: Dict[str, Any],
    force_reindex: bool = False
) -> Dict[str, int]:
    """
    Process a directory of PDFs for either Acts or Judgments.
    """
    if not folder_path.exists():
        folder_path.mkdir(parents=True, exist_ok=True)
        return {"processed": 0, "skipped": 0, "total_chunks": 0}

    pdf_files = list(folder_path.glob("*.pdf")) + list(folder_path.glob("*.PDF"))
    logger.info(f"[LOAD] Found {len(pdf_files)} PDF file(s) inside {folder_path}")

    db = Chroma(
        persist_directory=DB_PATH,
        embedding_function=get_embeddings(),
        collection_name=collection_name,
    )

    stats = {"processed": 0, "skipped": 0, "total_chunks": 0}

    for pdf_path in pdf_files:
        filename = pdf_path.name
        sha256_hash = compute_sha256(pdf_path)

        # Check incremental status
        cached_meta = indexed_docs.get(filename, {})
        if not force_reindex and cached_meta.get("sha256") == sha256_hash:
            logger.info(f"[INDEX] Skipping '{filename}' (SHA256 unchanged: {sha256_hash[:10]}...)")
            stats["skipped"] += 1
            continue

        if is_judgment:
            doc_title = pdf_path.stem.replace('_', ' ').title()
            logger.info(f"[EXTRACT] Processing Judgment '{filename}'...")
        else:
            doc_title, _ = ACT_MAPPINGS.get(filename.lower(), (pdf_path.stem.replace('_', ' ').title(), "Act"))
            logger.info(f"[EXTRACT] Processing Act '{filename}' ({doc_title})...")

        # Load PDF pages
        t0 = datetime.now()
        pages = load_pdf(str(pdf_path), act_name=doc_title)
        page_count = len(pages)
        t_load = (datetime.now() - t0).total_seconds()
        logger.info(f"[EXTRACT] Loaded {page_count} pages in {t_load:.2f}s")

        if page_count == 0:
            logger.warning(f"[SKIP] '{filename}' returned 0 readable pages. Skipping indexing.")
            stats["skipped"] += 1
            continue

        # Split documents into chunks
        t0 = datetime.now()
        chunks = split_documents(pages, default_act_name=doc_title)
        t_split = (datetime.now() - t0).total_seconds()
        logger.info(f"[SPLIT] Generated {len(chunks)} chunks in {t_split:.2f}s")

        # Extract judgment specific metadata or act metadata
        sample_text = filename + "\n" + "\n".join([p.page_content for p in pages[:3]])
        j_meta = parse_judgment_metadata(sample_text, filename) if is_judgment else {}

        # Enrich chunk metadata
        for chunk in chunks:
            chunk.metadata["collection"] = collection_name
            chunk.metadata["source"] = filename
            chunk.metadata["title"] = doc_title
            
            if is_judgment:
                chunk.metadata["document_type"] = "Judgment"
                chunk.metadata["case_name"] = j_meta["case_name"]
                chunk.metadata["citation"] = j_meta["citation"]
                chunk.metadata["court"] = j_meta["court"]
                chunk.metadata["year"] = j_meta["year"]
                chunk.metadata["judges"] = j_meta["judges"]
                chunk.metadata["bench"] = j_meta["bench"]
                chunk.metadata["holding"] = j_meta["holding"]
                chunk.metadata["act_name"] = j_meta["case_name"]  # Compatibility key
            else:
                doc_type = ACT_MAPPINGS.get(filename.lower(), (None, "Act"))[1]
                chunk.metadata["document_type"] = doc_type
                chunk.metadata["act_name"] = doc_title

        # Delete existing chunks for this specific document if updating
        try:
            existing = db.get(where={"source": filename})
            if existing and existing.get("ids"):
                db.delete(ids=existing["ids"])
                logger.info(f"[INDEX] Removed {len(existing['ids'])} old chunks for '{filename}'")
        except Exception as e:
            logger.warning(f"[INDEX] Could not purge old chunks for '{filename}': {e}")

        # Embed & add to vector store in smaller batches
        t0 = datetime.now()
        batch_size = 64
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            db.add_documents(batch)
            logger.info(f"[EMBED] Batch {i // batch_size + 1}/{(len(chunks) + batch_size - 1) // batch_size} ({len(batch)} chunks) indexed")
        t_embed = (datetime.now() - t0).total_seconds()
        logger.info(f"[EMBED] Total {len(chunks)} chunks indexed in {t_embed:.2f}s")

        # Update manifest record
        doc_entry = {
            "filename": filename,
            "sha256": sha256_hash,
            "indexed_at": datetime.now().isoformat(),
            "page_count": page_count,
            "chunk_count": len(chunks),
            "embedding_model": "BAAI/bge-small-en-v1.5",
            "collection_name": collection_name,
            "version": 1,
            "document_type": "Judgment" if is_judgment else chunk.metadata.get("document_type", "Act"),
            "act_name": j_meta.get("case_name", doc_title) if is_judgment else doc_title,
        }
        if is_judgment:
            doc_entry.update(j_meta)

        indexed_docs[filename] = doc_entry
        stats["processed"] += 1
        stats["total_chunks"] += len(chunks)

    return stats


def run_ingestion(force_reindex: bool = False) -> Dict[str, Any]:
    """
    Dual-collection RAG Ingestion Pipeline:
    - Scans `knowledge-base/acts/` and root `knowledge-base/*.pdf` -> `nyaya_constitution`
    - Scans `knowledge-base/judgments/` -> `nyaya_judgments`
    """
    logger.info("=" * 60)
    logger.info("[LOAD] Nyaya AI — Dual-Collection (Acts & Judgments) Ingestion")
    logger.info("=" * 60)

    manifest = load_manifest()
    indexed_docs = manifest.get("documents", {})

    total_stats = {"processed": 0, "skipped": 0, "total_chunks": 0}

    # 1. Process Acts Folder
    logger.info("--- Processing Acts Collection ---")
    acts_stats = process_pdf_folder(
        folder_path=ACTS_DIR if ACTS_DIR.exists() else KB_DIR,
        collection_name=COLLECTION_NAME,
        is_judgment=False,
        indexed_docs=indexed_docs,
        force_reindex=force_reindex,
    )
    for k in total_stats:
        total_stats[k] += acts_stats[k]

    # 2. Process Judgments Folder
    logger.info("--- Processing Judgments Collection ---")
    judg_stats = process_pdf_folder(
        folder_path=JUDGMENTS_DIR,
        collection_name=JUDGMENTS_COLLECTION_NAME,
        is_judgment=True,
        indexed_docs=indexed_docs,
        force_reindex=force_reindex,
    )
    for k in total_stats:
        total_stats[k] += judg_stats[k]

    manifest["documents"] = indexed_docs
    save_manifest(manifest)

    logger.info("=" * 60)
    logger.info(f"[INDEX] Ingestion finished. Total Processed: {total_stats['processed']}, Total Skipped: {total_stats['skipped']}")
    logger.info("=" * 60)

    return total_stats


if __name__ == "__main__":
    run_ingestion()
