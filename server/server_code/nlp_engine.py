# -*- coding: utf-8-sig -*-
"""
NLP motoru: Kelime vektörlerini yükler ve kosinüs benzerliği hesaplar.
"""

import csv
import os
import random
import numpy as np
from common_words import COMMON_TURKISH_WORDS


def load_vectors(csv_path: str) -> dict[str, np.ndarray]:
    """
    numberbatch_temiz.csv dosyasını belleğe yükler.
    Dönüş: {kelime: np.array(300,)} sözlüğü
    """
    vectors: dict[str, np.ndarray] = {}
    abs_path = os.path.abspath(csv_path)
    print(f"[NLP] Vektörler yükleniyor: {abs_path}")

    with open(abs_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 2:
                continue
            word = row[0].strip().lower()
            try:
                vec = np.array([float(x) for x in row[1:]], dtype=np.float32)
                if vec.shape[0] == 300:
                    vectors[word] = vec
            except (ValueError, IndexError):
                continue

    print(f"[NLP] {len(vectors)} kelime yüklendi.")
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
    # Yüzdeye çevir (0-100)
    return round(float(similarity) * 100, 1)


def get_all_similarities(
    word: str,
    board_words: list[str],
    vectors: dict[str, np.ndarray],
) -> list[dict]:
    """
    Tahmin edilen kelimenin tahtadaki tüm kelimelerle benzerlik skorlarını hesaplar.
    Dönüş: [{word1, word2, similarity, is_link}] listesi, skorlara göre azalan sırada.
    """
    if word not in vectors:
        return []

    word_vec = vectors[word]
    results = []

    for board_word in board_words:
        if board_word == word:
            continue
        if board_word not in vectors:
            continue

        sim = cosine_similarity(word_vec, vectors[board_word])
        results.append({
            "word1": word,
            "word2": board_word,
            "similarity": sim,
            "is_link": sim > 24,
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results


def pick_daily_pair(
    vectors: dict[str, np.ndarray],
    seed: int | None = None,
) -> tuple[str, str]:
    """
    Günlük bulmaca için iki uzak kelime seçer.
    COMMON_TURKISH_WORDS listesinden, vektörleri mevcut olan kelimelerden
    kosinüs benzerliği %10'un altında olan rastgele bir çift seçer.
    """
    # Vektörleri mevcut olan yaygın kelimeleri filtrele
    available = [w for w in COMMON_TURKISH_WORDS if w in vectors]

    if len(available) < 2:
        # Yedek: tüm vektörlerden seç
        available = list(vectors.keys())

    rng = random.Random(seed)

    # Maksimum 500 deneme yap
    for _ in range(500):
        word_a, word_b = rng.sample(available, 2)
        sim = cosine_similarity(vectors[word_a], vectors[word_b])
        if sim < 10:
            return (word_a, word_b)

    # 500 denemede bulunamazsa, en düşük benzerliğe sahip çifti seç
    best_pair = (available[0], available[1])
    best_sim = 100.0
    for _ in range(200):
        word_a, word_b = rng.sample(available, 2)
        sim = cosine_similarity(vectors[word_a], vectors[word_b])
        if sim < best_sim:
            best_sim = sim
            best_pair = (word_a, word_b)

    return best_pair
