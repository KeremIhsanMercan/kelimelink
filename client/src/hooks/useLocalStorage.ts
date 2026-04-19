import { useState, useEffect, useCallback } from 'react';

/**
 * Wordle tarzı localStorage hook'u.
 * Oyun durumunu tarayıcıda saklar ve geri yükler.
 */

// Oyun durumu tipi
export interface SavedGameState {
  date: string;
  wordA: string;
  wordB: string;
  guessedWords: string[];
  guessCount: number;
  isSolved: boolean;
}

// İstatistik tipi
export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
  guessDistribution: Record<number, number>; // guessCount -> # of times
}

const GAME_STATE_KEY = 'kelimelink-game-state';
const STATS_KEY = 'kelimelink-stats';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // JSON parse hatası — fallback kullan
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Depolama dolu veya erişim yok
  }
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
  guessDistribution: {},
};

export function useLocalStorage() {
  const [stats, setStats] = useState<PlayerStats>(() =>
    loadFromStorage(STATS_KEY, DEFAULT_STATS)
  );

  // İstatistikleri güncelle
  useEffect(() => {
    saveToStorage(STATS_KEY, stats);
  }, [stats]);

  /**
   * Bugünün kayıtlı oyun durumunu yükler.
   * Eğer bugüne ait kayıt yoksa null döner.
   */
  const loadGameState = useCallback((todayDate: string): SavedGameState | null => {
    const saved = loadFromStorage<SavedGameState | null>(GAME_STATE_KEY, null);
    if (saved && saved.date === todayDate) {
      return saved;
    }
    return null;
  }, []);

  /**
   * Oyun durumunu kaydeder.
   */
  const saveGameState = useCallback((state: SavedGameState): void => {
    saveToStorage(GAME_STATE_KEY, state);
  }, []);

  /**
   * Oyun kazanıldığında istatistikleri günceller.
   */
  const recordWin = useCallback((todayDate: string, guessCount: number): void => {
    setStats((prev) => {
      const isConsecutive =
        prev.lastPlayedDate !== null &&
        isYesterday(prev.lastPlayedDate, todayDate);

      const newStreak = isConsecutive ? prev.currentStreak + 1 : 1;
      const newDist = { ...(prev.guessDistribution || {}) };
      newDist[guessCount] = (newDist[guessCount] || 0) + 1;
      return {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + 1,
        currentStreak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        lastPlayedDate: todayDate,
        guessDistribution: newDist,
      };
    });
  }, []);

  return {
    stats,
    loadGameState,
    saveGameState,
    recordWin,
  };
}

/**
 * İki tarih stringi arasında 1 gün fark olup olmadığını kontrol eder.
 */
function isYesterday(prevDate: string, currentDate: string): boolean {
  const prev = new Date(prevDate);
  const curr = new Date(currentDate);
  const diff = curr.getTime() - prev.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  return diff > 0 && diff <= oneDay;
}
