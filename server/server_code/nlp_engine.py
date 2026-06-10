# -*- coding: utf-8-sig -*-
"""
NLP motoru: Kelime vektörlerini yükler ve kosinüs benzerliği hesaplar.
"""

import csv
import os
import random
import numpy as np
import hashlib
import unicodedata
from common_words import COMMON_TURKISH_WORDS
from config import SIMILARITY_THRESHOLD

def check_custom_link(word1: str, word2: str, custom_links_dict: dict[str, list[str]]) -> float | None:
    """
    Checks if there's a custom semantic link between two words.
    Returns a deterministic pseudo-random similarity score between 45.0 and 55.0
    if a link exists, otherwise None.
    """
    # Ensure both words are normalized to NFC for comparison
    word1 = unicodedata.normalize('NFC', word1.lower())
    word2 = unicodedata.normalize('NFC', word2.lower())

    has_link = False
    if word1 in custom_links_dict and word2 in custom_links_dict[word1]:
        has_link = True
    elif word2 in custom_links_dict and word1 in custom_links_dict[word2]:
        has_link = True
        
    if has_link:
        # Generate a deterministic random score based on the word pair
        pair_str = "_".join(sorted([word1, word2]))
        seed_val = int(hashlib.md5(pair_str.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed_val)
        return rng.randint(450, 550) / 10.0
        
    return None


def build_normalized_vectors(vectors: dict[str, np.ndarray]) -> dict[str, np.ndarray]:
    """Create L2-normalized vectors to avoid recalculating norms per request."""
    normalized: dict[str, np.ndarray] = {}
    for word, vec in vectors.items():
        norm = np.linalg.norm(vec)
        if norm == 0:
            continue
        normalized[word] = vec / norm
    return normalized


def load_vectors(csv_path: str) -> dict[str, np.ndarray]:
    """
    Vektör dosyasını belleğe yükler.
    Hızlı yükleme için önce .pkl dosyasını kontrol eder.
    """
    import pickle
    vectors: dict[str, np.ndarray] = {}
    abs_path = os.path.abspath(csv_path)
    pkl_path = abs_path + ".pkl"

    # Hızlı yükleme için pickle dosyasını dene
    if os.path.exists(pkl_path):
        print(f"[NLP] Hızlı yükleme: Pickle formatında vektörler yükleniyor: {pkl_path}")
        try:
            with open(pkl_path, "rb") as f:
                vectors = pickle.load(f)
            print(f"[NLP] {len(vectors)} kelime pickle'dan yüklendi.")
            return vectors
        except Exception as e:
            print(f"[NLP] Pickle yükleme hatası, CSV formatına dönülüyor: {e}")

    # Pickle yoksa veya yüklenemediyse CSV'den oku
    print(f"[NLP] Vektörler CSV'den yükleniyor: {abs_path}")
    try:
        with open(abs_path, "r", encoding="utf-8-sig") as f:
            for line in f:
                row = line.strip().split(',')
                if len(row) < 2:
                    continue
                word = unicodedata.normalize('NFC', row[0].strip().lower())
                try:
                    vec = np.array([float(x) for x in row[1:]], dtype=np.float32)
                    if vec.shape[0] == 300:
                        vectors[word] = vec
                except (ValueError, IndexError):
                    continue
    except FileNotFoundError:
        print(f"[NLP] HATA: Vektör dosyası bulunamadı: {abs_path}")
        return {}

    print(f"[NLP] {len(vectors)} kelime CSV'den yüklendi.")

    # Sonraki seferler için pickle olarak kaydet
    try:
        with open(pkl_path, "wb") as f:
            pickle.dump(vectors, f, protocol=pickle.HIGHEST_PROTOCOL)
        print(f"[NLP] Vektörler hızlı yükleme için pickle olarak kaydedildi: {pkl_path}")
    except Exception as e:
        print(f"[NLP] Vektörleri pickle olarak kaydetme hatası: {e}")

    return vectors


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    İki vektör arasındaki kosinüs benzerliğini yüzde olarak döndürür (0-100).
    """
    dot = np.dot(vec_a, vec_b)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    similarity = dot / (norm_a * norm_b)
    return round(float(similarity) * 100, 1)


def get_all_similarities_fast(
    word: str,
    board_words: list[str],
    normalized_vectors: dict[str, np.ndarray],
    custom_links_dict: dict[str, list[str]],
) -> list[dict]:
    """
    Fast path for similarity calculations using pre-normalized vectors.
    """
    results = []
    valid_board_words = []
    valid_board_vectors = []
    
    word_vec = normalized_vectors.get(word)

    for board_word in board_words:
        if board_word == word:
            continue
            
        custom_sim = check_custom_link(word, board_word, custom_links_dict)
        if custom_sim is not None:
            results.append({
                "word1": word,
                "word2": board_word,
                "similarity": custom_sim,
                "is_link": True,
            })
            continue

        if word_vec is None:
            continue
            
        board_vec = normalized_vectors.get(board_word)
        if board_vec is None:
            continue
            
        valid_board_words.append(board_word)
        valid_board_vectors.append(board_vec)

    if valid_board_vectors and word_vec is not None:
        board_matrix = np.stack(valid_board_vectors)
        similarities = np.round(np.dot(board_matrix, word_vec) * 100, 1)

        for idx, board_word in enumerate(valid_board_words):
            sim = float(similarities[idx])
            results.append({
                "word1": word,
                "word2": board_word,
                "similarity": sim,
                "is_link": sim >= SIMILARITY_THRESHOLD,
            })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results


def pick_daily_pair(
    vectors: dict[str, np.ndarray],
    custom_links_dict: dict[str, list[str]],
    seed: int | None = None,
) -> tuple[str, str]:
    """
    Günlük bulmaca için iki uzak kelime seçer.
    """
    rng = random.Random(seed)
    return _pick_pair(vectors, custom_links_dict, rng)


def pick_practice_pair(
    vectors: dict[str, np.ndarray],
    custom_links_dict: dict[str, list[str]],
) -> tuple[str, str]:
    """
    Pratik modu için rastgele bir çift seçer.
    """
    rng = random.Random()
    return _pick_pair(vectors, custom_links_dict, rng)


def _pick_pair(vectors: dict[str, np.ndarray], custom_links_dict: dict[str, list[str]], rng: random.Random) -> tuple[str, str]:
    """Vektör havuzundan birbirine uzak iki kelime seçer."""
    available = [w for w in COMMON_TURKISH_WORDS if w in vectors]

    if len(available) < 2:
        available = list(vectors.keys())

    # Try to find a pair with similarity < 0%
    for _ in range(500):
        word_a, word_b = rng.sample(available, 2)
        if check_custom_link(word_a, word_b, custom_links_dict) is not None:
            continue
            
        sim = cosine_similarity(vectors[word_a], vectors[word_b])
        if sim < 0.0: # Match documentation "below 0%"
            return (word_a, word_b)

    # Fallback: Find the pair with lowest similarity in 200 random samples
    best_pair = (available[0], available[1])
    best_sim = 100.0
    for _ in range(200):
        word_a, word_b = rng.sample(available, 2)
        if check_custom_link(word_a, word_b, custom_links_dict) is not None:
            continue
            
        sim = cosine_similarity(vectors[word_a], vectors[word_b])
        if sim < best_sim:
            best_sim = sim
            best_pair = (word_a, word_b)

    return best_pair


def batch_similarities(
    words: list[str],
    vectors: dict[str, np.ndarray],
    custom_links_dict: dict[str, list[str]],
) -> dict:
    """
    Verilen tüm kelimelerin birbirleriyle olan benzerliklerini hesaplar.
    """
    unique_words = list(set(words))
    # Kelimenin vektörü olmasa bile custom linki olabilir
    valid_words = [w for w in unique_words if w in vectors or w in custom_links_dict or any(w in v for v in custom_links_dict.values())]
    
    links = []
    sim_map = {w: [] for w in valid_words}
    
    for i in range(len(valid_words)):
        w1 = valid_words[i]
        v1 = vectors.get(w1)
        for j in range(i + 1, len(valid_words)):
            w2 = valid_words[j]
            v2 = vectors.get(w2)
            
            custom_sim = check_custom_link(w1, w2, custom_links_dict)
            if custom_sim is not None:
                sim = custom_sim
                is_link = True
            else:
                if v1 is None or v2 is None:
                    continue
                sim = cosine_similarity(v1, v2)
                is_link = sim >= SIMILARITY_THRESHOLD
            
            res1 = {"word1": w1, "word2": w2, "similarity": sim, "is_link": is_link}
            res2 = {"word1": w2, "word2": w1, "similarity": sim, "is_link": is_link}
            
            sim_map[w1].append(res1)
            sim_map[w2].append(res2)
            
            if is_link:
                links.append({"word1": w1, "word2": w2, "similarity": sim})
                
    for w in sim_map:
        sim_map[w].sort(key=lambda x: x["similarity"], reverse=True)
        
    return {
        "links": links,
        "similarities": sim_map
    }


def find_hint_word(
    word_a: str,
    word_b: str,
    normalized_vectors: dict[str, np.ndarray],
    custom_links_dict: dict[str, list[str]],
    is_super_hint: bool = False
) -> str | None:
    """
    Find a hint word that has >30% similarity with word_a 
    and between 15% and 25% similarity with word_b.
    If is_super_hint is True, try to find a word >=26% with both.
    """
    vec_a = normalized_vectors.get(word_a)
    vec_b = normalized_vectors.get(word_b)

    if vec_a is None or vec_b is None:
        return None

    keys = list(normalized_vectors.keys())
    if not keys:
        return None

    start_idx = random.randint(0, len(keys) - 1)
    
    normal_hint = None
    best_fallback = None
    best_sim_b = -100.0  # using -100.0 to catch even negative similarities safely
    
    for i in range(len(keys)):
        idx = (start_idx + i) % len(keys)
        w = keys[idx]
        
        if w == word_a or w == word_b:
            continue
            
        vec = normalized_vectors[w]
        
        # We only care if sim_a >= 26.0 for all conditions, so we can calculate it once
        sim_a_rounded = round(float(np.dot(vec_a, vec)) * 100, 1)
        
        if sim_a_rounded >= 26.0:
            sim_b_rounded = round(float(np.dot(vec_b, vec)) * 100, 1)
            
            # 1. Super Hint (highest priority if requested)
            if is_super_hint and sim_b_rounded >= 26.0:
                return w
                
            # 2. Normal Hint
            if normal_hint is None and sim_a_rounded > 30.0 and 15.0 <= sim_b_rounded <= 25.0:
                normal_hint = w
                # Return immediately if we are not looking for a super hint
                if not is_super_hint:
                    return normal_hint
                    
            # 3. Fallback Hint
            if sim_b_rounded > best_sim_b:
                best_sim_b = sim_b_rounded
                best_fallback = w
                
    if normal_hint is not None:
        return normal_hint
        
    return best_fallback

