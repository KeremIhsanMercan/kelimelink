import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchDailyPuzzle, fetchPracticePuzzle, submitGuess, fetchSimilarities, recordSolve, fetchStats, rebuildBoard, type SimilarityResult } from '../services/api';
import { useLocalStorage } from './useLocalStorage';

/* ============================================
   Tip tanımları
   ============================================ */

export interface GraphNode {
  id: string;
  word: string;
  type: 'start_a' | 'start_b' | 'guessed';
  chainSide: 'a' | 'b' | 'both' | 'none';
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  similarity: number;
}

export type WinAnimationPhase = 'idle' | 'highlighting' | 'done';
export type GameMode = 'daily' | 'practice';

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
   BFS: Zincir tespiti
   ============================================ */

function buildAdjacency(links: GraphLink[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const link of links) {
    const s = typeof link.source === 'object' ? (link.source as GraphNode).id : link.source;
    const t = typeof link.target === 'object' ? (link.target as GraphNode).id : link.target;
    if (!adj.has(s)) adj.set(s, new Set());
    if (!adj.has(t)) adj.set(t, new Set());
    adj.get(s)!.add(t);
    adj.get(t)!.add(s);
  }
  return adj;
}

function bfs(start: string, adj: Map<string, Set<string>>): Set<string> {
  const visited = new Set<string>();
  const queue = [start];
  visited.add(start);
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current);
    if (neighbors) {
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
  }
  return visited;
}

function findShortestPath(
  start: string,
  end: string,
  adj: Map<string, Set<string>>
): string[] | null {
  if (start === end) return [start];
  const visited = new Set<string>([start]);
  const queue: string[][] = [[start]];
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const neighbors = adj.get(current);
    if (!neighbors) continue;
    for (const n of neighbors) {
      if (n === end) return [...path, n];
      if (!visited.has(n)) {
        visited.add(n);
        queue.push([...path, n]);
      }
    }
  }
  return null;
}

/* ============================================
   Hook
   ============================================ */

export function useGameState() {
  const { stats, practiceStats, username, setUsername, loadGameState, saveGameState, loadPracticeGameState, savePracticeGameState, clearPracticeGameState, recordWin, recordPracticeWin } = useLocalStorage();

  const hasRecordedWin = useRef(false);

  const [gameMode, setGameMode] = useState<GameMode>('daily');

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

  // Tüm benzerlik sonuçlarını sakla (her kelime için)
  const allSimilaritiesRef = useRef<Map<string, SimilarityResult[]>>(new Map());

  /* ---------- Zincir taraflarını güncelle ---------- */
  const updateChainSides = useCallback(
    (nodes: GraphNode[], links: GraphLink[], wordA: string, wordB: string): GraphNode[] => {
      const adj = buildAdjacency(links);
      const chainA = bfs(wordA, adj);
      const chainB = bfs(wordB, adj);

      return nodes.map((node) => {
        const inA = chainA.has(node.id);
        const inB = chainB.has(node.id);
        let chainSide: GraphNode['chainSide'] = 'none';
        if (inA && inB) chainSide = 'both';
        else if (inA) chainSide = 'a';
        else if (inB) chainSide = 'b';
        return { ...node, chainSide };
      });
    },
    []
  );

  const rebuildSavedBoard = useCallback(
    async (wordA: string, wordB: string, guessedWords: string[]) => {
      const nodes: GraphNode[] = createBaseNodes(wordA, wordB);
      for (const word of guessedWords) {
        nodes.push({ id: word, word: word, type: 'guessed', chainSide: 'none' });
      }

      try {
        const result = await rebuildBoard(wordA, wordB, guessedWords);

        // Benzerlik sonuçlarını cache'e doldur
        for (const [word, sims] of Object.entries(result.similarities)) {
          allSimilaritiesRef.current.set(word, sims);
        }

        const links: GraphLink[] = result.links.map((l) => ({
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

  /* ---------- Kazanma kontrolü ---------- */
  const checkWin = useCallback(
    (links: GraphLink[], wordA: string, wordB: string): boolean => {
      const adj = buildAdjacency(links);
      const reachable = bfs(wordA, adj);
      return reachable.has(wordB);
    },
    []
  );

  /* ---------- En kısa yol ---------- */
  const getShortestPath = useCallback((): string[] | null => {
    const adj = buildAdjacency(state.links);
    return findShortestPath(state.wordA, state.wordB, adj);
  }, [state.links, state.wordA, state.wordB]);

  /* ---------- Günlük oyun başlatma ---------- */
  const initDailyGame = useCallback(async () => {
    allSimilaritiesRef.current = new Map();
    hasRecordedWin.current = false;

    const puzzle = await fetchDailyPuzzle();
    const saved = loadGameState(puzzle.date);

    if (saved) {
      const { nodes, links } = await rebuildSavedBoard(
        puzzle.word_a,
        puzzle.word_b,
        saved.guessedWords
      );
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

    // Yeni oyun
    const serverOffset = puzzle.server_time ? new Date(puzzle.server_time).getTime() - Date.now() : 0;
    return buildGameState({
      puzzleDate: puzzle.date,
      wordA: puzzle.word_a,
      wordB: puzzle.word_b,
      nextPuzzleAt: puzzle.next_puzzle_at,
      serverOffset,
    });
  }, [loadGameState, rebuildSavedBoard, updateChainSides]);

  /* ---------- Pratik oyun başlatma ---------- */
  const initPracticeGame = useCallback(async (forceNew = false) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    allSimilaritiesRef.current = new Map();
    hasRecordedWin.current = false;

    if (forceNew) {
      clearPracticeGameState();
    } else {
      const saved = loadPracticeGameState();
      if (saved) {
        const { nodes, links } = await rebuildSavedBoard(
          saved.wordA,
          saved.wordB,
          saved.guessedWords
        );
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

      setState(buildGameState({
        puzzleDate: '', // Pratik modda tarih yok
        wordA: puzzle.word_a,
        wordB: puzzle.word_b,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Sunucu güncelleniyor, lütfen daha sonra tekrar deneyin.',
      }));
    }
  }, [clearPracticeGameState, loadPracticeGameState, rebuildSavedBoard, updateChainSides]);


  /* ---------- İlk yükleme: günlük oyun ---------- */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextState = await initDailyGame();
        if (!cancelled) {
          setState(nextState);
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Sunucu güncelleniyor, lütfen daha sonra tekrar deneyin.',
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initDailyGame]);

  /* ---------- Mod değiştirme ---------- */
  const switchToDaily = useCallback(async () => {
    if (gameMode === 'daily') return;
    setGameMode('daily');
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const nextState = await initDailyGame();
      setState(nextState);
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Günlük bulmaca yüklenemedi.',
      }));
    }
  }, [gameMode, initDailyGame]);

  const switchToPractice = useCallback(async () => {
    setGameMode('practice');
    await initPracticeGame(false);
  }, [initPracticeGame]);

  const startNewPracticeGame = useCallback(async () => {
    setGameMode('practice');
    await initPracticeGame(true);
  }, [initPracticeGame]);


  /* ---------- Kelime tahmin et ---------- */
  const addWord = useCallback(
    async (word: string) => {
      let w = word.trim().replace('İ', 'i').replace('I', 'ı').toLowerCase();
      if (!w || state.isSolved) return;

      // En az 2 karakter kontrolü
      if (w.length < 2) {
        setState((prev) => ({ ...prev, error: 'Kelime en az 2 harf içermelidir.' }));
        return;
      }

      // Aynı kelime kontrolü
      if (state.nodes.some((n) => n.id === w)) {
        setState((prev) => ({ ...prev, error: `'${w}' zaten tahtada mevcut.` }));
        return;
      }

      setState((prev) => ({ ...prev, isGuessing: true, error: null }));

      try {
        const boardWords = state.nodes.map((n) => n.id);
        const result = await submitGuess(w, boardWords, username);

        // Benzerlik sonuçlarını sakla
        allSimilaritiesRef.current.set(w, result.similarities);

        // Mevcut cache'leri güncelle (çift yönlü)
        for (const sim of result.similarities) {
          const otherWord = sim.word1 === w ? sim.word2 : sim.word1;
          const existingCache = allSimilaritiesRef.current.get(otherWord);
          if (existingCache) {
            // Zaten eklenmiş mi diye kontrol et
            if (!existingCache.some(s => s.word1 === w || s.word2 === w)) {
              existingCache.push(sim);
              // Sıralamayı korumak için tekrar sırala (yüksekten düşüğe)
              existingCache.sort((a, b) => b.similarity - a.similarity);
            }
          }
        }

        setState((prev) => {
          const newNode: GraphNode = {
            id: w,
            word: w,
            type: 'guessed',
            chainSide: 'none',
          };
          const newNodes = [...prev.nodes, newNode];

          const newLinks = [...prev.links];
          for (const link of result.links) {
            newLinks.push({
              source: link.word1,
              target: link.word2,
              similarity: link.similarity,
            });
          }

          const newGuessCount = prev.guessCount + 1;
          const updatedNodes = updateChainSides(newNodes, newLinks, prev.wordA, prev.wordB);

          // Kazanma kontrolü
          const won = checkWin(newLinks, prev.wordA, prev.wordB);

          // Oyun durumunu kaydet
          const guessedWords = updatedNodes
            .filter((n) => n.type === 'guessed')
            .map((n) => n.word);

          if (gameMode === 'daily') {
            saveGameState({
              date: prev.puzzleDate,
              wordA: prev.wordA,
              wordB: prev.wordB,
              guessedWords,
              guessCount: newGuessCount,
              isSolved: won,
            });
          } else {
            savePracticeGameState({
              date: '',
              wordA: prev.wordA,
              wordB: prev.wordB,
              guessedWords,
              guessCount: newGuessCount,
              isSolved: won,
            });
          }


          if (won && !hasRecordedWin.current) {
            hasRecordedWin.current = true;

            // Shortest path detection (already computed below, but we need it here for recordSolve)
            const adjForPath = buildAdjacency(newLinks);
            const winPathLocal = findShortestPath(prev.wordA, prev.wordB, adjForPath);

            if (gameMode === 'daily') {
              recordWin(prev.puzzleDate, newGuessCount);
              recordSolve(newGuessCount, winPathLocal, 'daily', username).catch(() => { });
            } else {
              recordPracticeWin(newGuessCount);
              recordSolve(newGuessCount, winPathLocal, 'practice', username).catch(() => { });
            }
          }

          // If won, compute shortest path and preserve pre-win chain sides for animation
          let winPath: string[] | null = null;
          let preWinSides: Record<string, GraphNode['chainSide']> | null = null;
          if (won) {
            const adjForPath = buildAdjacency(newLinks);
            winPath = findShortestPath(prev.wordA, prev.wordB, adjForPath);
            // Snapshot chain sides BEFORE win so animation can blend blue/red → purple
            preWinSides = {};
            for (const n of prev.nodes) {
              preWinSides[n.id] = n.chainSide;
            }
            preWinSides[w] = 'none'; // new word hasn't been colored yet
          }

          return {
            ...prev,
            nodes: updatedNodes,
            links: newLinks,
            guessCount: newGuessCount,
            isSolved: won,
            showWinBanner: false, // Don't show banner yet — animation first
            isGuessing: false,
            error: null,
            selectedNode: w,
            selectedNodeSimilarities: result.similarities,
            winAnimationPhase: won ? 'highlighting' : 'idle',
            winShortestPath: won ? winPath : null,
            preWinChainSides: preWinSides,
            lastAddedNodeId: w,
          };
        });
      } catch (err: any) {
        let message = 'Bir hata oluştu.';

        // 1. Axios hatası mı kontrol et
        if (err.response) {
          // Sunucu bir hata kodu döndürdü (404, 400 vb.)
          const serverDetail = err.response.data?.detail;

          if (typeof serverDetail === 'string') {
            message = serverDetail;
          } else if (Array.isArray(serverDetail)) {
            // FastAPI bazen validasyon hatalarını liste olarak döner
            message = serverDetail[0]?.msg || 'Veri formatı hatalı.';
          } else if (err.response.data?.message) {
            message = err.response.data.message;
          }
        } else if (err.request) {
          // İstek yapıldı ama yanıt alınamadı (İnternet yok veya sunucu kapalı)
          message = 'Sunucu güncelleniyor, lütfen daha sonra tekrar deneyin.';
        } else {
          // İstek kurulurken bir hata oluştu
          message = err.message || message;
        }

        setState((prev) => ({ ...prev, isGuessing: false, error: message }));
      }
    },
    [state.nodes, state.isSolved, updateChainSides, checkWin, saveGameState, recordWin, recordPracticeWin, gameMode, savePracticeGameState, username]
  );

  /* ---------- Düğüm seçimi ---------- */
  const selectNode = useCallback(
    async (nodeId: string) => {
      // Önce cache'e bak
      const cached = allSimilaritiesRef.current.get(nodeId);
      if (cached && cached.length > 0) {
        setState((prev) => ({
          ...prev,
          selectedNode: nodeId,
          selectedNodeSimilarities: cached,
        }));
        return;
      }

      // Cache'de yoksa (başlangıç kelimeleri vb.) API'den iste
      setState((prev) => ({
        ...prev,
        selectedNode: nodeId,
        selectedNodeSimilarities: [],
      }));

      try {
        const boardWords = state.nodes
          .map((n) => n.id)
          .filter((id) => id !== nodeId);
        if (boardWords.length === 0) return;

        const result = await fetchSimilarities(nodeId, boardWords, username);
        allSimilaritiesRef.current.set(nodeId, result.similarities);
        setState((prev) => ({
          ...prev,
          selectedNodeSimilarities: result.similarities,
        }));
      } catch {
        // Benzerlik hesaplanamadı
      }
    },
    [state.nodes, username]
  );

  /* ---------- Banner kapatma ---------- */
  const closeWinBanner = useCallback(() => {
    setState((prev) => ({ ...prev, showWinBanner: false }));
  }, []);

  /* ---------- Animasyon tamamlandı: banner göster ---------- */
  const finishWinAnimation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      winAnimationPhase: 'done',
      showWinBanner: true,
    }));
  }, []);

  /* ---------- Günlük rekor bilgisi ---------- */
  const [dailyRecordHolder, setDailyRecordHolder] = useState<{
    username: string | null;
    path: string | null;
    minGuesses: number;
  } | null>(null);

  useEffect(() => {
    if (gameMode !== 'daily' || state.isLoading) return;

    const doFetch = () => {
      fetchStats('daily').then((gs) => {
        setDailyRecordHolder({
          username: gs.min_guesses_username,
          path: gs.min_guesses_path,
          minGuesses: gs.min_guesses,
        });
      }).catch(() => { });
    };

    doFetch();

    // Yeni çözüm sonrası sunucunun kaydı tamamlamasını bekle
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
  };
}

