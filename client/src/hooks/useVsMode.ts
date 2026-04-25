import { useState, useCallback, useRef } from 'react';
import type { GraphNode, GraphLink } from '../utils/graphUtils';

export interface WinnerInfo {
  username: string;
  guesses: number;
  path: string[];
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface VsRoomState {
  roomCode: string | null;
  status: 'disconnected' | 'waiting' | 'playing' | 'finished';
  wordA: string | null;
  wordB: string | null;
  players: string[];
  winnerInfo: WinnerInfo | null;
  error: string | null;
  isLoading: boolean;
}

export function useVsMode(username: string) {
  const [state, setState] = useState<VsRoomState>({
    roomCode: null,
    status: 'disconnected',
    wordA: null,
    wordB: null,
    players: [],
    winnerInfo: null,
    error: null,
    isLoading: false,
  });
  
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((code: string) => {
    return new Promise<void>((resolve, reject) => {
      if (wsRef.current) wsRef.current.close();
      
      const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const wsBase = API_BASE.replace('http:', 'ws:').replace('https:', 'wss:');
      const wsUrl = `${wsBase}/api/ws/vs/${code}?username=${encodeURIComponent(username)}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let hasResolved = false;

      ws.onopen = () => {
        // We don't resolve yet, we wait for the first room_state
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'room_state') {
          setState(s => ({
            ...s,
            roomCode: data.room_code,
            status: data.status,
            wordA: data.word_a,
            wordB: data.word_b,
            players: data.players,
            winnerInfo: data.winner_info,
            error: null,
            isLoading: false,
          }));
          if (!hasResolved) {
            hasResolved = true;
            resolve();
          }
        } else if (data.type === 'game_start') {
          setState(s => ({ ...s, status: 'playing', error: null, isLoading: false }));
        } else if (data.type === 'game_over') {
          setState(s => ({ ...s, status: 'finished', winnerInfo: data.winner_info }));
        } else if (data.type === 'error') {
          setState(s => ({ ...s, error: data.message, isLoading: false }));
          if (!hasResolved) {
            hasResolved = true;
            reject(new Error(data.message));
          }
          ws.close();
        }
      };
      
      ws.onclose = (event) => {
        if (!hasResolved) {
          hasResolved = true;
          reject(new Error('Bağlantı kurulamadı.'));
        }
        // Code 1008 = policy violation (room not found)
        if (event.code === 1000 || event.code === 1001) {
          setState(s => ({ ...s, status: 'disconnected', isLoading: false }));
        } else {
          setState(s => ({
            ...s,
            status: 'disconnected',
            error: s.error ?? 'Bağlantı kesildi.',
            isLoading: false,
          }));
        }
      };
    });
  }, [username]);

  const createRoom = useCallback(async (wordA?: string, wordB?: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/vs/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_a: wordA || null, word_b: wordB || null })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Oda kurulamadı');
      }
      await connect(data.room_code);
      return data.room_code;
    } catch (e: any) {
      console.error(e);
      setState(s => ({ ...s, isLoading: false, error: e.message }));
      throw e;
    }
  }, [connect]);

  const joinRoom = useCallback((code: string) => {
    setState(s => ({ ...s, error: null, isLoading: true }));
    connect(code);
  }, [connect]);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  const leaveRoom = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState({
      roomCode: null,
      status: 'disconnected',
      wordA: null,
      wordB: null,
      players: [],
      winnerInfo: null,
      error: null,
      isLoading: false,
    });
  }, []);

  const startGame = useCallback(() => {
    if (wsRef.current && state.status === 'waiting') {
      setState(s => ({ ...s, isLoading: true }));
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
    }
  }, [state.status]);

  const sendSolved = useCallback((guesses: number, path: string[], nodes: GraphNode[], links: GraphLink[]) => {
    if (wsRef.current && state.status === 'playing') {
      wsRef.current.send(JSON.stringify({
        type: 'solved',
        guesses,
        path,
        nodes,
        links,
      }));
    }
  }, [state.status]);

  const restartGame = useCallback((wordA?: string, wordB?: string) => {
    if (wsRef.current) {
      setState(s => ({ ...s, isLoading: true, error: null }));
      wsRef.current.send(JSON.stringify({
        type: 'restart_game',
        word_a: wordA || null,
        word_b: wordB || null
      }));
    }
  }, []);

  return {
    ...state,
    createRoom,
    joinRoom,
    clearError,
    leaveRoom,
    startGame,
    sendSolved,
    restartGame,
  };
}
