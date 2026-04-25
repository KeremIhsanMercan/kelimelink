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
  });
  
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback((code: string) => {
    if (wsRef.current) wsRef.current.close();
    
    // Check if in dev or prod
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // In dev, Vite is on 5173, backend on 8000. For production, they are same host.
    let host = window.location.host;
    if (host.includes('localhost:5173') || host.includes('127.0.0.1:5173')) {
      host = host.replace('5173', '8000');
    }

    const wsUrl = `${protocol}//${host}/api/ws/vs/${code}?username=${encodeURIComponent(username)}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setState(s => ({ ...s, error: null }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'room_state') {
        setState(s => ({
          ...s,
          roomCode: data.room_code,
          status: data.status === 'finished' && s.status === 'playing' ? 'playing' : data.status,
          wordA: data.word_a,
          wordB: data.word_b,
          players: data.players,
          winnerInfo: data.winner_info,
          error: null,
        }));
      } else if (data.type === 'game_start') {
        setState(s => ({ ...s, status: 'playing', error: null }));
      } else if (data.type === 'game_over') {
        setState(s => ({ ...s, status: 'finished', winnerInfo: data.winner_info }));
      } else if (data.type === 'error') {
        setState(s => ({ ...s, error: data.message }));
        ws.close();
      }
    };
    
    ws.onclose = (event) => {
      // Code 1008 = policy violation (room not found)
      if (event.code === 1000 || event.code === 1001) {
        setState(s => ({ ...s, status: 'disconnected' }));
      } else {
        setState(s => ({
          ...s,
          status: 'disconnected',
          error: s.error ?? 'Bağlantı kesildi.',
        }));
      }
    };
  }, [username]);

  const createRoom = useCallback(async (wordA?: string, wordB?: string) => {
    try {
      let host = window.location.host;
      let protocol = window.location.protocol;
      if (host.includes('localhost:5173') || host.includes('127.0.0.1:5173')) {
        host = host.replace('5173', '8000');
      }
      const res = await fetch(`${protocol}//${host}/api/vs/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_a: wordA || null, word_b: wordB || null })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Oda kurulamadı');
      }
      connect(data.room_code);
      return data.room_code;
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }, [connect]);

  const joinRoom = useCallback((code: string) => {
    setState(s => ({ ...s, error: null }));
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
    });
  }, []);

  const startGame = useCallback(() => {
    if (wsRef.current && state.status === 'waiting') {
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
