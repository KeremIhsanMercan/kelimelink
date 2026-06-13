import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DailyPuzzle {
  date: string;
  word_a: string;
  word_b: string;
  server_time: string;
  next_puzzle_at: string;
}

export interface SimilarityResult {
  word1: string;
  word2: string;
  similarity: number;
  is_link: boolean;
}

export interface GuessResponse {
  word: string;
  similarities: SimilarityResult[];
  links: SimilarityResult[];
  has_links: boolean;
}

export interface GlobalStats {
  total_solves: number;
  average_guesses: number;
  min_guesses: number;
  min_guesses_username: string | null;
  min_guesses_path: string | null;
}

export async function fetchDailyPuzzle(): Promise<DailyPuzzle> {
  const res = await api.get<DailyPuzzle>('/api/daily-puzzle');
  return res.data;
}

export interface PracticePuzzle {
  word_a: string;
  word_b: string;
}

export async function fetchPracticePuzzle(): Promise<PracticePuzzle> {
  const res = await api.get<PracticePuzzle>('/api/practice-puzzle');
  return res.data;
}

export async function submitGuess(word: string, boardWords: string[], username: string = 'Anonim'): Promise<GuessResponse> {
  const res = await api.post<GuessResponse>('/api/guess', {
    word,
    board_words: boardWords,
    username: username || 'Anonim',
  });
  return res.data;
}

export async function fetchSimilarities(word: string, boardWords: string[], username: string = 'Anonim'): Promise<GuessResponse> {
  const res = await api.post<GuessResponse>('/api/similarities', {
    word,
    board_words: boardWords,
    username: username || 'Anonim',
  });
  return res.data;
}

export async function recordSolve(
  guessCount: number,
  path: string[] | null,
  gamemode: string = 'daily',
  username: string = '',
  deviceId?: string,
  maxStreak?: number,
  totalGamesWon?: number
): Promise<void> {
  await api.post('/api/solve', {
    guess_count: guessCount,
    path: path,
    gamemode,
    username,
    device_id: deviceId || undefined,
    max_streak: maxStreak !== undefined ? maxStreak : undefined,
    total_games_won: totalGamesWon !== undefined ? totalGamesWon : undefined,
  });
}

export async function fetchStats(gamemode: string = 'daily'): Promise<GlobalStats> {
  const res = await api.get<GlobalStats>('/api/stats', { params: { gamemode } });
  return res.data;
}

export interface RebuildResponse {
  links: { word1: string; word2: string; similarity: number }[];
  similarities: Record<string, SimilarityResult[]>;
}

export async function rebuildBoard(wordA: string, wordB: string, guessedWords: string[]): Promise<RebuildResponse> {
  const res = await api.post<RebuildResponse>('/api/rebuild-board', {
    word_a: wordA,
    word_b: wordB,
    guessed_words: guessedWords,
  });
  return res.data;
}

export async function submitCustomLinkReport(wordA: string, wordB: string, reason: string, username: string = 'Anonim'): Promise<void> {
  await api.post('/api/custom-link-report', {
    word_a: wordA,
    word_b: wordB,
    reason: reason,
    username: username || 'Anonim',
  });
}

export async function fetchHintWord(wordA: string, wordB: string, username: string = 'Anonim', isSuperHint: boolean = false): Promise<{ hint_word: string }> {
  const res = await api.post<{ hint_word: string }>('/api/hint', {
    word_a: wordA,
    word_b: wordB,
    username: username || 'Anonim',
    is_super_hint: isSuperHint
  });
  return res.data;
}

export interface LeaderboardEntry {
  username: string;
  value: number;
}

export interface LeaderboardData {
  streaks: LeaderboardEntry[];
  champions: LeaderboardEntry[];
  total_wins: LeaderboardEntry[];
}

let cachedLeaderboard: LeaderboardData | null = null;
let leaderboardFetchPromise: Promise<LeaderboardData> | null = null;

export async function fetchLeaderboard(): Promise<LeaderboardData> {
  if (leaderboardFetchPromise) {
    return leaderboardFetchPromise;
  }

  leaderboardFetchPromise = api.get<LeaderboardData>('/api/leaderboard')
    .then(res => {
      cachedLeaderboard = res.data;
      leaderboardFetchPromise = null;
      return res.data;
    })
    .catch(err => {
      leaderboardFetchPromise = null;
      throw err;
    });

  return leaderboardFetchPromise;
}

export function getCachedLeaderboard(): LeaderboardData | null {
  return cachedLeaderboard;
}

