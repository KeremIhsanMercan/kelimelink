import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  fetchDailyPuzzle, fetchPracticePuzzle, submitGuess, 
  fetchSimilarities, recordSolve, fetchStats, rebuildBoard, 
  type SimilarityResult 
} from '../services/api';
import { useLocalStorage } from './useLocalStorage';
import type { 
  GraphNode, GraphLink 
} from '../utils/graphUtils';
import { 
  updateChainSides, 
  bfs, buildAdjacency, findShortestPath 
} from '../utils/graphUtils';


/* ============================================
   Tip tanımları
   ============================================ */
export type WinAnimationPhase = 'idle' | 'highlighting' | 'done';
export type GameMode = 'daily' | 'practice' | 'vs';

export interface GameState {
  isLoading: boolean;
  error: string | null;
  puzzleDate: string;
  wordA: string;
  wordB: string;
  nodes: GraphNode[];
  links: GraphLink[];
  guessCount: number;
  isSolved: boolean;
  showWinBanner: boolean;
  selectedNode: string | null;
  selectedNodeSimilarities: SimilarityResult[];
  isGuessing: boolean;
  winAnimationPhase: WinAnimationPhase;
  winShortestPath: string[] | null;
  preWinChainSides: Record<string, GraphNode['chainSide']> | null;
  nextPuzzleAt: string | null;
  serverOffset: number; // milliseconds
  lastAddedNodeId: string | null;
}

interface BuildGameStateParams {
  puzzleDate: string;
  wordA: string;
  wordB: string;
  nodes?: GraphNode[];
  links?: GraphLink[];
  guessCount?: number;
  isSolved?: boolean;
  nextPuzzleAt?: string | null;
  serverOffset?: number;
  lastAddedNodeId?: string | null;
}

function createBaseNodes(wordA: string, wordB: string): GraphNode[] {
  return [
    { id: wordA, word: wordA, type: 'start_a', chainSide: 'a' },
    { id: wordB, word: wordB, type: 'start_b', chainSide: 'b' },
  ];
}

function buildGameState({
  puzzleDate,
  wordA,
  wordB,
  nodes = createBaseNodes(wordA, wordB),
  links = [],
  guessCount = 0,
  isSolved = false,
  nextPuzzleAt = null,
  serverOffset = 0,
  lastAddedNodeId = null,
}: BuildGameStateParams): GameState {
  return {
    isLoading: false,
    error: null,
    puzzleDate,
    wordA,
    wordB,
    nodes,
    links,
    guessCount,
    isSolved,
    showWinBanner: false,
    selectedNode: null,
    selectedNodeSimilarities: [],
    isGuessing: false,
    winAnimationPhase: 'idle',
    winShortestPath: null,
    preWinChainSides: null,
    nextPuzzleAt,
    serverOffset,
    lastAddedNodeId,
  };
}

/* ============================================
   Hook
   ============================================ */

export function useGameState() {
  const { 
    stats, practiceStats, vsStats, username, setUsername, 
    loadGameState, saveGameState, loadPracticeGameState, 
    savePracticeGameState, clearPracticeGameState, 
    recordWin, recordPracticeWin, recordVsGame 
  } = useLocalStorage();

  const hasRecordedWin = useRef(false);
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const allSimilaritiesRef = useRef<Map<string, SimilarityResult[]>>(new Map());

  const [state, setState] = useState<GameState>({
    isLoading: true,
    error: null,
    puzzleDate: '',
    wordA: '',
    wordB: '',
    nodes: [],
    links: [],
    guessCount: 0,
    isSolved: false,
    showWinBanner: false,
    selectedNode: null,
    selectedNodeSimilarities: [],
    isGuessing: false,
    winAnimationPhase: 'idle',
    winShortestPath: null,
    preWinChainSides: null,
    nextPuzzleAt: null,
    serverOffset: 0,
    lastAddedNodeId: null,
  });

  const rebuildSavedBoard = useCallback(
    async (wordA: string, wordB: string, guessedWords: string[]) => {
      const nodes: GraphNode[] = createBaseNodes(wordA, wordB);
      for (const word of guessedWords) {
        nodes.push({ id: word, word: word, type: 'guessed', chainSide: 'none' });
      }

      try {
        const result = await rebuildBoard(wordA, wordB, guessedWords);
        for (const [word, sims] of Object.entries(result.similarities)) {
          allSimilaritiesRef.current.set(word, sims as SimilarityResult[]);
        }
        const links: GraphLink[] = result.links.map((l: any) => ({
          source: l.word1,
          target: l.word2,
          similarity: l.similarity,
        }));
        return { nodes, links };
      } catch (err) {
        console.error('Board rebuilding failed:', err);
        return { nodes, links: [] };
      }
    },
    []
  );

  const getShortestPath = useCallback((): string[] | null => {
    const adj = buildAdjacency(state.links);
    return findShortestPath(state.wordA, state.wordB, adj);
  }, [state.links, state.wordA, state.wordB]);

  const initDailyGame = useCallback(async () => {
    allSimilaritiesRef.current = new Map();
    hasRecordedWin.current = false;

    const puzzle = await fetchDailyPuzzle();
    const saved = loadGameState(puzzle.date);

    if (saved) {
      const { nodes, links } = await rebuildSavedBoard(puzzle.word_a, puzzle.word_b, saved.guessedWords);
      const updatedNodes = updateChainSides(nodes, links, puzzle.word_a, puzzle.word_b);
      hasRecordedWin.current = saved.isSolved;
      const serverOffset = puzzle.server_time ? new Date(puzzle.server_time).getTime() - Date.now() : 0;

      return buildGameState({
        puzzleDate: puzzle.date,
        wordA: puzzle.word_a,
        wordB: puzzle.word_b,
        nodes: updatedNodes,
        links,
        guessCount: saved.guessCount,
        isSolved: saved.isSolved,
        nextPuzzleAt: puzzle.next_puzzle_at,
        serverOffset,
        lastAddedNodeId: saved.guessedWords.length > 0 ? saved.guessedWords[saved.guessedWords.length - 1] : null,
      });
    }

    const serverOffset = puzzle.server_time ? new Date(puzzle.server_time).getTime() - Date.now() : 0;
    return buildGameState({
      puzzleDate: puzzle.date,
      wordA: puzzle.word_a,
      wordB: puzzle.word_b,
      nextPuzzleAt: puzzle.next_puzzle_at,
      serverOffset,
    });
  }, [loadGameState, rebuildSavedBoard]);

  const initPracticeGame = useCallback(async (forceNew = false) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    allSimilaritiesRef.current = new Map();
    hasRecordedWin.current = false;

    if (forceNew) {
      clearPracticeGameState();
    } else {
      const saved = loadPracticeGameState();
      if (saved) {
        const { nodes, links } = await rebuildSavedBoard(saved.wordA, saved.wordB, saved.guessedWords);
        const updatedNodes = updateChainSides(nodes, links, saved.wordA, saved.wordB);
        hasRecordedWin.current = saved.isSolved;

        setState(buildGameState({
          puzzleDate: '',
          wordA: saved.wordA,
          wordB: saved.wordB,
          nodes: updatedNodes,
          links,
          guessCount: saved.guessCount,
          isSolved: saved.isSolved,
          lastAddedNodeId: saved.guessedWords.length > 0 ? saved.guessedWords[saved.guessedWords.length - 1] : null,
        }));
        return;
      }
    }

    try {
      const puzzle = await fetchPracticePuzzle();
      setState(buildGameState({ puzzleDate: '', wordA: puzzle.word_a, wordB: puzzle.word_b }));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Sunucu güncelleniyor...' }));
    }
  }, [clearPracticeGameState, loadPracticeGameState, rebuildSavedBoard]);

  useEffect(() => {
    let cancelled = false;
    initDailyGame().then(nextState => {
      if (!cancelled) setState(nextState);
    }).catch(() => {
      if (!cancelled) setState(prev => ({ ...prev, isLoading: false, error: 'Bulmaca yüklenemedi.' }));
    });
    return () => { cancelled = true; };
  }, [initDailyGame]);

  const switchToPractice = useCallback(async () => {
    const fromVs = gameMode === 'vs';
    setGameMode('practice');
    await initPracticeGame(fromVs);
  }, [gameMode, initPracticeGame]);

  const switchToDaily = useCallback(async () => {
    setGameMode('daily');
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const nextState = await initDailyGame();
      setState(nextState);
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Günlük bulmaca yüklenemedi.' }));
    }
  }, [initDailyGame]);

  const startNewPracticeGame = useCallback(async () => {
    setGameMode('practice');
    await initPracticeGame(true);
  }, [initPracticeGame]);

  const startVsGame = useCallback((wordA: string, wordB: string) => {
    setGameMode('vs');
    allSimilaritiesRef.current = new Map();
    hasRecordedWin.current = false;
    setState(buildGameState({ puzzleDate: '', wordA, wordB }));
  }, []);

  const resetVsGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      nodes: [],
      links: [],
      guessCount: 0,
      isSolved: false,
      winAnimationPhase: 'idle',
      winShortestPath: null,
      preWinChainSides: null,
      selectedNode: null,
      selectedNodeSimilarities: [],
    }));
  }, []);

  const loadBoard = useCallback((nodes: GraphNode[], links: GraphLink[], isSolved: boolean, guessCount: number) => {
    setState((prev) => ({ ...prev, nodes, links, isSolved, guessCount }));
  }, []);

  const addWord = useCallback(
    async (word: string) => {
      let w = word.trim().replace('İ', 'i').replace('I', 'ı').toLowerCase();
      if (!w || state.isSolved) return;

      if (w.length < 2) {
        setState((prev) => ({ ...prev, error: 'Kelime en az 2 harf içermelidir.' }));
        return;
      }
      if (state.nodes.some((n) => n.id === w)) {
        setState((prev) => ({ ...prev, error: `'${w}' zaten tahtada mevcut.` }));
        return;
      }

      setState((prev) => ({ ...prev, isGuessing: true, error: null }));

      try {
        const boardWords = state.nodes.map((n) => n.id);
        const result = await submitGuess(w, boardWords, username);

        allSimilaritiesRef.current.set(w, result.similarities);
        for (const sim of result.similarities) {
          const otherWord = sim.word1 === w ? sim.word2 : sim.word1;
          const existingCache = allSimilaritiesRef.current.get(otherWord);
          if (existingCache && !existingCache.some(s => s.word1 === w || s.word2 === w)) {
            existingCache.push(sim);
            existingCache.sort((a, b) => b.similarity - a.similarity);
          }
        }

        setState((prev) => {
          const newNode: GraphNode = { id: w, word: w, type: 'guessed', chainSide: 'none' };
          const newNodes = [...prev.nodes, newNode];
          const newLinks = [...prev.links, ...result.links.map(l => ({ source: l.word1, target: l.word2, similarity: l.similarity }))];
          const newGuessCount = prev.guessCount + 1;
          const updatedNodes = updateChainSides(newNodes, newLinks, prev.wordA, prev.wordB);
          
          const adjForPath = buildAdjacency(newLinks);
          const won = bfs(prev.wordA, adjForPath).has(prev.wordB);

          // Save game state
          const guessedWords = updatedNodes.filter((n) => n.type === 'guessed').map((n) => n.word);
          if (gameMode === 'daily') saveGameState({ date: prev.puzzleDate, wordA: prev.wordA, wordB: prev.wordB, guessedWords, guessCount: newGuessCount, isSolved: won });
          else if (gameMode === 'practice') savePracticeGameState({ date: '', wordA: prev.wordA, wordB: prev.wordB, guessedWords, guessCount: newGuessCount, isSolved: won });

          if (won && !hasRecordedWin.current) {
            hasRecordedWin.current = true;
            const winPathLocal = findShortestPath(prev.wordA, prev.wordB, adjForPath);
            if (gameMode === 'daily') {
              recordWin(prev.puzzleDate, newGuessCount);
              recordSolve(newGuessCount, winPathLocal, 'daily', username).catch(() => { });
            } else if (gameMode === 'practice') {
              recordPracticeWin(newGuessCount);
              recordSolve(newGuessCount, winPathLocal, 'practice', username).catch(() => { });
            } else if (gameMode === 'vs') {
              recordSolve(newGuessCount, winPathLocal, 'vs', username).catch(() => { });
            }
          }

          let preWinSides: Record<string, GraphNode['chainSide']> | null = null;
          if (won) {
            preWinSides = {};
            for (const n of prev.nodes) preWinSides[n.id] = n.chainSide;
            preWinSides[w] = 'none';
          }

          return {
            ...prev,
            nodes: updatedNodes,
            links: newLinks,
            guessCount: newGuessCount,
            isSolved: won,
            isGuessing: false,
            selectedNode: w,
            selectedNodeSimilarities: result.similarities,
            winAnimationPhase: won ? 'highlighting' : 'idle',
            winShortestPath: won ? findShortestPath(prev.wordA, prev.wordB, adjForPath) : null,
            preWinChainSides: preWinSides,
            lastAddedNodeId: w,
          };
        });
      } catch (err: any) {
        let message = err.response?.data?.detail || err.message || 'Bir hata oluştu.';
        if (Array.isArray(message)) message = message[0]?.msg || 'Hata';
        setState((prev) => ({ ...prev, isGuessing: false, error: message }));
      }
    },
    [state.nodes, state.isSolved, state.puzzleDate, state.wordA, state.wordB, saveGameState, recordWin, recordPracticeWin, gameMode, savePracticeGameState, username]
  );

  const selectNode = useCallback(
    async (nodeId: string) => {
      const cached = allSimilaritiesRef.current.get(nodeId);
      if (cached && cached.length > 0) {
        setState((prev) => ({ ...prev, selectedNode: nodeId, selectedNodeSimilarities: cached }));
        return;
      }

      setState((prev) => ({ ...prev, selectedNode: nodeId, selectedNodeSimilarities: [] }));
      try {
        const boardWords = state.nodes.map((n) => n.id).filter((id) => id !== nodeId);
        if (boardWords.length === 0) return;
        const result = await fetchSimilarities(nodeId, boardWords, username);
        allSimilaritiesRef.current.set(nodeId, result.similarities);
        setState((prev) => ({ ...prev, selectedNodeSimilarities: result.similarities }));
      } catch { }
    },
    [state.nodes, username]
  );

  const closeWinBanner = useCallback(() => {
    setState((prev) => ({ ...prev, showWinBanner: false }));
  }, []);

  const finishWinAnimation = useCallback(() => {
    setState((prev) => ({ ...prev, winAnimationPhase: 'done', showWinBanner: true }));
  }, []);

  const [dailyRecordHolder, setDailyRecordHolder] = useState<{
    username: string | null;
    path: string | null;
    minGuesses: number;
  } | null>(null);

  useEffect(() => {
    if (gameMode !== 'daily' || state.isLoading) return;
    const doFetch = () => {
      fetchStats('daily').then((gs) => {
        setDailyRecordHolder({ username: gs.min_guesses_username, path: gs.min_guesses_path, minGuesses: gs.min_guesses });
      }).catch(() => { });
    };
    doFetch();
    if (state.isSolved) {
      const timer = setTimeout(doFetch, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameMode, state.isLoading, state.isSolved]);

  return {
    ...state,
    gameMode,
    stats,
    practiceStats,
    vsStats,
    username,
    setUsername,
    dailyRecordHolder,
    addWord,
    selectNode,
    closeWinBanner,
    getShortestPath,
    finishWinAnimation,
    switchToDaily,
    switchToPractice,
    startNewPracticeGame,
    startVsGame,
    resetVsGame,
    loadBoard,
    recordVsGame,
  };
}
