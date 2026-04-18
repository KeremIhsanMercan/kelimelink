import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchDailyPuzzle, submitGuess, fetchSimilarities, recordSolve, type SimilarityResult } from '../services/api';
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
  const { stats, loadGameState, saveGameState, recordWin } = useLocalStorage();
  const hasRecordedWin = useRef(false);

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

  /* ---------- Başlatma ---------- */
  useEffect(() => {
    async function init() {
      try {
        const puzzle = await fetchDailyPuzzle();
        const saved = loadGameState(puzzle.date);

        if (saved && saved.isSolved) {
          // Çözülmüş oyunu geri yükle — tüm kelimeler için benzerlik bilgisini yeniden oluştur
          const nodes: GraphNode[] = [
            { id: puzzle.word_a, word: puzzle.word_a, type: 'start_a', chainSide: 'a' },
            { id: puzzle.word_b, word: puzzle.word_b, type: 'start_b', chainSide: 'b' },
          ];

          const allWords = [puzzle.word_a, puzzle.word_b, ...saved.guessedWords];
          const links: GraphLink[] = [];

          // Her tahmin edilen kelime için benzerlik skorlarını yeniden hesapla
          for (const guessedWord of saved.guessedWords) {
            nodes.push({ id: guessedWord, word: guessedWord, type: 'guessed', chainSide: 'none' });
            
            // O kelimeden önceki tüm kelimelerle benzerliği hesapla
            const boardBefore = allWords.filter(w => w !== guessedWord);
            try {
              const result = await submitGuess(guessedWord, boardBefore);
              allSimilaritiesRef.current.set(guessedWord, result.similarities);
              for (const link of result.links) {
                links.push({
                  source: link.word1,
                  target: link.word2,
                  similarity: link.similarity,
                });
              }
            } catch {
              // Benzerlik hesaplanamadı, devam et
            }
          }

          const updatedNodes = updateChainSides(nodes, links, puzzle.word_a, puzzle.word_b);
          hasRecordedWin.current = true;

          setState({
            isLoading: false,
            error: null,
            puzzleDate: puzzle.date,
            wordA: puzzle.word_a,
            wordB: puzzle.word_b,
            nodes: updatedNodes,
            links,
            guessCount: saved.guessCount,
            isSolved: true,
            showWinBanner: false,
            selectedNode: null,
            selectedNodeSimilarities: [],
            isGuessing: false,
          });
          return;
        }

        if (saved) {
          // Devam eden oyunu geri yükle
          const nodes: GraphNode[] = [
            { id: puzzle.word_a, word: puzzle.word_a, type: 'start_a', chainSide: 'a' },
            { id: puzzle.word_b, word: puzzle.word_b, type: 'start_b', chainSide: 'b' },
          ];
          const allWords = [puzzle.word_a, puzzle.word_b, ...saved.guessedWords];
          const links: GraphLink[] = [];

          for (const guessedWord of saved.guessedWords) {
            nodes.push({ id: guessedWord, word: guessedWord, type: 'guessed', chainSide: 'none' });
            const boardBefore = allWords.filter(w => w !== guessedWord);
            try {
              const result = await submitGuess(guessedWord, boardBefore);
              allSimilaritiesRef.current.set(guessedWord, result.similarities);
              for (const link of result.links) {
                links.push({
                  source: link.word1,
                  target: link.word2,
                  similarity: link.similarity,
                });
              }
            } catch {
              // devam et
            }
          }

          const updatedNodes = updateChainSides(nodes, links, puzzle.word_a, puzzle.word_b);

          setState({
            isLoading: false,
            error: null,
            puzzleDate: puzzle.date,
            wordA: puzzle.word_a,
            wordB: puzzle.word_b,
            nodes: updatedNodes,
            links,
            guessCount: saved.guessCount,
            isSolved: false,
            showWinBanner: false,
            selectedNode: null,
            selectedNodeSimilarities: [],
            isGuessing: false,
          });
          return;
        }

        // Yeni oyun
        setState({
          isLoading: false,
          error: null,
          puzzleDate: puzzle.date,
          wordA: puzzle.word_a,
          wordB: puzzle.word_b,
          nodes: [
            { id: puzzle.word_a, word: puzzle.word_a, type: 'start_a', chainSide: 'a' },
            { id: puzzle.word_b, word: puzzle.word_b, type: 'start_b', chainSide: 'b' },
          ],
          links: [],
          guessCount: 0,
          isSolved: false,
          showWinBanner: false,
          selectedNode: null,
          selectedNodeSimilarities: [],
          isGuessing: false,
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Sunucuya bağlanılamadı. Lütfen sunucunun çalıştığından emin olun.',
        }));
      }
    }
    init();
  }, [loadGameState, updateChainSides]);

  /* ---------- Kelime tahmin et ---------- */
  const addWord = useCallback(
    async (word: string) => {
      const w = word.trim().toLowerCase();
      if (!w || state.isSolved) return;

      // En az 3 karakter kontrolü
      if (w.length < 3) {
        setState((prev) => ({ ...prev, error: 'Kelime en az 3 harf içermelidir.' }));
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
        const result = await submitGuess(w, boardWords);

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

          saveGameState({
            date: prev.puzzleDate,
            wordA: prev.wordA,
            wordB: prev.wordB,
            guessedWords,
            guessCount: newGuessCount,
            isSolved: won,
          });

          if (won && !hasRecordedWin.current) {
            hasRecordedWin.current = true;
            recordWin(prev.puzzleDate);
            recordSolve(newGuessCount).catch(() => {});
          }

          return {
            ...prev,
            nodes: updatedNodes,
            links: newLinks,
            guessCount: newGuessCount,
            isSolved: won,
            showWinBanner: won,
            isGuessing: false,
            error: null,
            selectedNode: w,
            selectedNodeSimilarities: result.similarities,
          };
        });
      } catch (err: unknown) {
        let message = 'Bir hata oluştu.';
        if (err && typeof err === 'object' && 'response' in err) {
          const resp = (err as { response?: { data?: { detail?: string } } }).response;
          if (resp?.data?.detail) {
            message = resp.data.detail;
          }
        }
        setState((prev) => ({ ...prev, isGuessing: false, error: message }));
      }
    },
    [state.nodes, state.isSolved, state.links, state.wordA, state.wordB, state.puzzleDate, updateChainSides, checkWin, saveGameState, recordWin]
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

        const result = await fetchSimilarities(nodeId, boardWords);
        allSimilaritiesRef.current.set(nodeId, result.similarities);
        setState((prev) => ({
          ...prev,
          selectedNodeSimilarities: result.similarities,
        }));
      } catch {
        // Benzerlik hesaplanamadı
      }
    },
    [state.nodes]
  );

  /* ---------- Banner kapatma ---------- */
  const closeWinBanner = useCallback(() => {
    setState((prev) => ({ ...prev, showWinBanner: false }));
  }, []);

  return {
    ...state,
    stats,
    addWord,
    selectNode,
    closeWinBanner,
    getShortestPath,
  };
}
