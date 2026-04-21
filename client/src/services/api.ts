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

export async function submitGuess(word: string, boardWords: string[]): Promise<GuessResponse> {
  const res = await api.post<GuessResponse>('/api/guess', {
    word,
    board_words: boardWords,
  });
  return res.data;
}

export async function fetchSimilarities(word: string, boardWords: string[]): Promise<GuessResponse> {
  const res = await api.post<GuessResponse>('/api/similarities', {
    word,
    board_words: boardWords,
  });
  return res.data;
}

export async function recordSolve(guessCount: number, isPractice: boolean = false): Promise<void> {
  await api.post('/api/solve', { guess_count: guessCount, is_practice: isPractice });
}

export async function fetchStats(): Promise<GlobalStats> {
  const res = await api.get<GlobalStats>('/api/stats');
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
