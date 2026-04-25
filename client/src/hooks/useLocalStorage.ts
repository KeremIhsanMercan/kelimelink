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

// Pratik istatistik tipi (seri takibi yok)
export interface PracticeStats {
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: Record<number, number>;
}

const GAME_STATE_KEY = 'kelimelink-game-state';
const STATS_KEY = 'kelimelink-stats';
const PRACTICE_STATS_KEY = 'kelimelink-practice-stats';
const PRACTICE_GAME_STATE_KEY = 'kelimelink-practice-game-state';
const USERNAME_KEY = 'kelimelink-username';

function generateUsername(): string {
  const num = Math.floor(Math.random() * 1000) + 1;
  return `Oyuncu${num}`;
}


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

function incrementGuessDistribution(
  distribution: Record<number, number> | undefined,
  guessCount: number
): Record<number, number> {
  const next = { ...(distribution || {}) };
  next[guessCount] = (next[guessCount] || 0) + 1;
  return next;
}

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
  guessDistribution: {},
};

const DEFAULT_PRACTICE_STATS: PracticeStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  guessDistribution: {},
};

export function useLocalStorage() {
  const [stats, setStats] = useState<PlayerStats>(() =>
    loadFromStorage(STATS_KEY, DEFAULT_STATS)
  );

  const [practiceStats, setPracticeStats] = useState<PracticeStats>(() =>
    loadFromStorage(PRACTICE_STATS_KEY, DEFAULT_PRACTICE_STATS)
  );

  // İstatistikleri güncelle
  useEffect(() => {
    saveToStorage(STATS_KEY, stats);
  }, [stats]);

  useEffect(() => {
    saveToStorage(PRACTICE_STATS_KEY, practiceStats);
  }, [practiceStats]);

  // Kullanıcı adı yönetimi
  const [username, setUsernameState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(USERNAME_KEY);
      if (saved && saved.trim()) return saved;
    } catch (e) {
      // localStorage erişimi engellenmiş olabilir
    }
    const generated = generateUsername();
    try {
      localStorage.setItem(USERNAME_KEY, generated);
    } catch (e) {
      // localStorage yazma hatası
    }
    return generated;
  });

  const setUsername = useCallback((name: string): void => {
    const trimmed = name.trim();
    if (trimmed && trimmed.length <= 20) {
      setUsernameState(trimmed);
      localStorage.setItem(USERNAME_KEY, trimmed);
    }
  }, []);

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
   * Pratik oyun durumunu yükler.
   */
  const loadPracticeGameState = useCallback(() => {
    return loadFromStorage<SavedGameState | null>(PRACTICE_GAME_STATE_KEY, null);
  }, []);

  /**
   * Pratik oyun durumunu kaydeder.
   */
  const savePracticeGameState = useCallback((state: SavedGameState): void => {
    saveToStorage(PRACTICE_GAME_STATE_KEY, state);
  }, []);

  /**
   * Pratik oyun durumunu temizler.
   */
  const clearPracticeGameState = useCallback((): void => {
    localStorage.removeItem(PRACTICE_GAME_STATE_KEY);
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
      return {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + 1,
        currentStreak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        lastPlayedDate: todayDate,
        guessDistribution: incrementGuessDistribution(prev.guessDistribution, guessCount),
      };
    });
  }, []);

  /**
   * Pratik modu kazanıldığında istatistikleri günceller.
   * Günlük istatistikleri etkilemez.
   */
  const recordPracticeWin = useCallback((guessCount: number): void => {
    setPracticeStats((prev) => {
      return {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + 1,
        guessDistribution: incrementGuessDistribution(prev.guessDistribution, guessCount),
      };
    });
  }, []);

  return {
    stats,
    practiceStats,
    username,
    setUsername,
    loadGameState,
    saveGameState,
    loadPracticeGameState,
    savePracticeGameState,
    clearPracticeGameState,
    recordWin,
    recordPracticeWin,
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
