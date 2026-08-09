"""
recommender.py
==============
AI/ML matching engine for the Barter System.
Evaluates the compatibility between a target user and a list of candidate users for skill exchange.
"""

import logging
from typing import Any, List, Dict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger("ml_service")

# Lazy-load sentence-transformers
_sbert_model = None

def _get_sbert():
    global _sbert_model
    if _sbert_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading Sentence-BERT model...")
            _sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence-BERT model loaded ✓")
        except Exception as exc:
            logger.warning(f"Sentence-BERT unavailable: {exc}")
    return _sbert_model

# Lazy-load XGBoost
_xgb_available = None

def _xgb_ok():
    global _xgb_available
    if _xgb_available is None:
        try:
            import xgboost  # noqa: F401
            _xgb_available = True
        except ImportError:
            _xgb_available = False
            logger.warning("XGBoost not installed. Using weighted linear combination.")
    return _xgb_available

def _build_user_text(user: Dict[str, Any]) -> str:
    """Build a document representing the user's background."""
    parts = []
    if user.get("bio"):
        parts.append(user["bio"])
    if user.get("college"):
        parts.append(user["college"])
    if user.get("department"):
        parts.append(user["department"])
    
    # Add skills
    for skill in user.get("offeredSkills", []):
        s_info = skill.get("skill", {})
        parts.append(s_info.get("name", ""))
        parts.append(s_info.get("category", ""))
    
    return " ".join(parts).strip().lower()

def compute_tfidf_scores(target_user: Dict[str, Any], candidates: List[Dict[str, Any]]) -> np.ndarray:
    target_doc = _build_user_text(target_user)
    candidate_docs = [_build_user_text(c) for c in candidates]
    
    if not target_doc.strip():
        return np.zeros(len(candidates))
        
    corpus = [target_doc] + candidate_docs
    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000, stop_words="english")
        matrix = vectorizer.fit_transform(corpus)
        target_vec = matrix[0]
        cand_vecs = matrix[1:]
        scores = cosine_similarity(target_vec, cand_vecs).flatten()
        return np.clip(scores, 0, 1).astype(np.float32)
    except Exception as exc:
        logger.error(f"TF-IDF error: {exc}")
        return np.zeros(len(candidates), dtype=np.float32)

def compute_semantic_scores(target_user: Dict[str, Any], candidates: List[Dict[str, Any]]) -> np.ndarray:
    model = _get_sbert()
    if model is None:
        return np.zeros(len(candidates), dtype=np.float32)
        
    try:
        target_doc = _build_user_text(target_user)
        if not target_doc.strip():
            return np.zeros(len(candidates), dtype=np.float32)
            
        candidate_docs = [_build_user_text(c) for c in candidates]
        all_docs = [target_doc] + candidate_docs
        
        embeddings = model.encode(all_docs, batch_size=32, show_progress_bar=False, normalize_embeddings=True)
        target_emb = embeddings[0:1]
        cand_embs = embeddings[1:]
        
        scores = cosine_similarity(target_emb, cand_embs).flatten()
        return np.clip(scores, 0.0, 1.0).astype(np.float32)
    except Exception as exc:
        logger.error(f"SBERT error: {exc}")
        return np.zeros(len(candidates), dtype=np.float32)

def check_strict_match(target_user: Dict[str, Any], candidate: Dict[str, Any]) -> float:
    """Check if they have a strict skill swap."""
    t_offered = {s.get("skillId") for s in target_user.get("offeredSkills", [])}
    t_learning = {s.get("skillId") for s in target_user.get("learningSkills", [])}
    
    c_offered = {s.get("skillId") for s in candidate.get("offeredSkills", [])}
    c_learning = {s.get("skillId") for s in candidate.get("learningSkills", [])}
    
    has_swap = bool(t_offered.intersection(c_learning) and t_learning.intersection(c_offered))
    partial_swap = bool(t_offered.intersection(c_learning) or t_learning.intersection(c_offered))
    
    if has_swap:
        return 1.0
    if partial_swap:
        return 0.5
    return 0.0

def _compute_features(target: Dict, candidates: List[Dict], tfidf: np.ndarray, sbert: np.ndarray) -> np.ndarray:
    n = len(candidates)
    features = np.zeros((n, 5), dtype=np.float32)
    
    t_college = (target.get("college") or "").strip().lower()
    t_dept = (target.get("department") or "").strip().lower()
    
    for i, c in enumerate(candidates):
        features[i, 0] = tfidf[i]
        features[i, 1] = sbert[i]
        features[i, 2] = check_strict_match(target, c)
        
        c_college = (c.get("college") or "").strip().lower()
        c_dept = (c.get("department") or "").strip().lower()
        
        features[i, 3] = 1.0 if (t_college and t_college == c_college) else 0.0
        features[i, 4] = 1.0 if (t_dept and t_dept == c_dept) else 0.0
        
    return features

# Pre-trained weights for the linear fallback:
# tfidf (0.15), sbert (0.25), strict_match (0.45), same_college (0.10), same_dept (0.05)
_WEIGHTS = np.array([0.15, 0.25, 0.45, 0.10, 0.05], dtype=np.float32)

def compute_rank(features: np.ndarray) -> np.ndarray:
    if _xgb_ok():
        try:
            import xgboost as xgb
            dtrain = xgb.DMatrix(features)
            labels = features @ _WEIGHTS
            dtrain_labeled = xgb.DMatrix(features, label=labels)
            params = {"objective": "reg:squarederror", "max_depth": 3, "learning_rate": 0.2, "n_estimators": 30, "verbosity": 0}
            booster = xgb.train(params, dtrain_labeled, num_boost_round=20, verbose_eval=False)
            return booster.predict(dtrain).astype(np.float32)
        except Exception:
            pass
    return (features @ _WEIGHTS).astype(np.float32)

def recommend(payload: dict) -> list[dict]:
    target_user = payload.get("user", {})
    candidates = payload.get("candidates", [])
    
    if not candidates:
        return []
        
    tfidf = compute_tfidf_scores(target_user, candidates)
    sbert = compute_semantic_scores(target_user, candidates)
    
    features = _compute_features(target_user, candidates, tfidf, sbert)
    final_scores = compute_rank(features)
    
    fs_min, fs_max = final_scores.min(), final_scores.max()
    if fs_max > fs_min:
        norm_final = (final_scores - fs_min) / (fs_max - fs_min)
    else:
        norm_final = np.ones(len(candidates), dtype=np.float32)
        
    ranked_indices = np.argsort(norm_final)[::-1]
    
    results = []
    for idx in ranked_indices:
        c = candidates[idx]
        final = float(norm_final[idx])
        strict = float(features[idx, 2])
        
        reason = "A strong potential partner for skill exchange."
        if strict == 1.0:
            reason = "Perfect Match! You both offer what the other wants."
        elif strict == 0.5:
            reason = "Partial Match! One of you offers what the other wants."
        elif features[idx, 3] == 1.0:
            reason = f"You both go to {target_user.get('college')} with compatible interests."
        elif sbert[idx] > 0.4:
            reason = "High semantic alignment with your profile."
            
        results.append({
            "candidateId": c.get("id"),
            "score": round(final, 4),
            "matchPercentage": round(final * 100, 1),
            "reason": reason
        })
        
    return results
