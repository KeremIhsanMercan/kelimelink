import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import type { SimilarityResult } from '../services/api';
import { submitCustomLinkReport } from '../services/api';

import type { GameMode, GraphNode } from '../hooks/useGameState';
import AdUnit from './AdUnit';
import { Trophy, HelpCircle, Plus } from 'lucide-react';

interface SidebarProps {
  wordA: string;
  wordB: string;
  nodeCount: number;
  guessCount: number;
  isSolved: boolean;
  isGuessing: boolean;
  error: string | null;
  selectedNode: string | null;
  selectedNodeSimilarities: SimilarityResult[];
  nodes: GraphNode[];
  shortestPath: string[] | null;
  onAddWord: (word: string) => void;
  onSelectNode: (word: string) => void;
  gameMode: GameMode;
  nextPuzzleAt: string | null;
  serverOffset: number;
  onTimerEnd?: () => void;
  dailyRecordHolder?: {
    username: string | null;
    path: string | null;
    minGuesses: number;
  } | null;
  username: string;
  vsWinnerUsername?: string | null;
}

export default function Sidebar({
  wordA,
  wordB,
  guessCount,
  isSolved,
  isGuessing,
  error,
  selectedNode,
  selectedNodeSimilarities,
  nodes,
  shortestPath,
  onAddWord,
  onSelectNode,
  gameMode,
  nextPuzzleAt,
  serverOffset,
  onTimerEnd,
  dailyRecordHolder,
  username,
  vsWinnerUsername,
}: SidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showRecord, setShowRecord] = useState(false);

  // const { username } = useLocalStorage(); // Artık prop olarak geliyor

  // Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportWord1, setReportWord1] = useState('');
  const [reportWord2, setReportWord2] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportModalClosing, setReportModalClosing] = useState(false);


  useEffect(() => {
    if (!isGuessing && !isSolved && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGuessing, isSolved]);

  useEffect(() => {
    if (gameMode !== 'daily' || !nextPuzzleAt) return;

    const target = new Date(nextPuzzleAt).getTime();

    const updateTimer = () => {
      const now = Date.now() + serverOffset;
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        if (onTimerEnd) onTimerEnd();
        return;
      }

      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameMode, nextPuzzleAt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [selectedNode]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isGuessing || isSolved) return;

    // En az 2 karakter kontrolü
    if (trimmed.length < 2) {
      setLocalWarning('Kelime en az 2 harf içermelidir.');
      return;
    }

    setLocalWarning(null);
    onAddWord(trimmed);
    setInputValue('');
    window.scrollTo(0, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const openReportModal = (w1: string, w2: string) => {
    setReportWord1(w1);
    setReportWord2(w2);
    setReportReason('');
    setReportError(null);
    setReportSuccess(false);
    setReportModalOpen(true);
    setReportModalClosing(false);
  };

  const closeReportModal = () => {
    setReportModalClosing(true);
    setTimeout(() => {
      setReportModalOpen(false);
      setReportModalClosing(false);
    }, 300);
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      setReportError('Lütfen sebebini yazın.');
      return;
    }
    setIsSubmittingReport(true);
    setReportError(null);
    try {
      await submitCustomLinkReport(reportWord1, reportWord2, reportReason, username);
      setReportSuccess(true);
      setTimeout(() => {
        closeReportModal();
      }, 2000);
    } catch (err: any) {
      setReportError('Rapor gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    // Kullanıcı yazarken uyarıyı temizle
    if (localWarning) setLocalWarning(null);
  };

  const getNodeSide = (word: string): string => {
    // If game is solved and word is on the shortest path, return 'path'
    if (isSolved && shortestPath && shortestPath.includes(word)) {
      return 'path';
    }
    const node = nodes.find(n => n.id === word);
    return node ? node.chainSide : 'none';
  };

  const getRowSide = (word1: string, word2: string): string => {
    const w1OnPath = isSolved && shortestPath && shortestPath.includes(word1);
    const w2OnPath = isSolved && shortestPath && shortestPath.includes(word2);

    if (w1OnPath && w2OnPath) {
      return 'path';
    }

    // If not both on path, return the actual chainSide of the other word
    const node = nodes.find(n => n.id === word2);
    return node ? node.chainSide : 'none';
  };

  return (
    <aside className="sidebar">
      {/* Başlangıç Kelimeleri */}
      <div className="sidebar__section">
        <div className="sidebar__label">{gameMode === 'practice' ? 'Pratik Bulmaca' : 'Günlük Bulmaca'}</div>
        <div className="starting-words">
          <span className="starting-word starting-word--a">{wordA}</span>
          <span className="starting-words__arrow">⟷</span>
          <span className="starting-word starting-word--b">{wordB}</span>
        </div>
        {gameMode === 'daily' && (
          <p className="links-info" style={{ marginTop: '12px', marginBottom: 0 }}>
            Sonraki bulmacaya: {timeLeft}
          </p>
        )}
      </div>

      {/* Kelime Ekleme */}
      <div className="sidebar__section">
        <div className="sidebar__label">Kelime Ekle</div>
        <form className="guess-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="guess-input"
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bir kelime yazın..."
            disabled={isGuessing || isSolved}
            autoFocus
          />
          <button
            className="guess-btn"
            type="submit"
            disabled={!inputValue.trim() || isGuessing || isSolved}
          >
            {isGuessing ? '...' : 'Ekle'}
          </button>
        </form>
        {localWarning && <div className="error-message">{localWarning}</div>}
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Durum */}
      <div className="sidebar__section">
        <div className="sidebar__label">Durum</div>
        <p className="status-text" style={{ marginTop: 4 }}>
          Toplam <strong>{guessCount} tahmin</strong> yapıldı.
        </p>
        {isSolved && (
          <>
            <p
              className="status-text"
              style={{
                marginTop: 8,
                color: '#059669',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {vsWinnerUsername && vsWinnerUsername !== username ? (
                <><Trophy size={16} /> {vsWinnerUsername} kazandı!</>
              ) : (
                <><Trophy size={16} /> Bulmaca çözüldü!</>
              )}
              {gameMode === 'daily' && !vsWinnerUsername && (
                <button
                  className="record-hint-btn"
                  onClick={() => setShowRecord((prev) => !prev)}
                  title="Günün rekorunu gör"
                >
                  <HelpCircle size={15} />
                </button>
              )}
            </p>
            {showRecord && gameMode === 'daily' && (
              <div className="record-popover">
                {dailyRecordHolder && dailyRecordHolder.minGuesses > 0 && dailyRecordHolder.username ? (
                  <>
                    <div className="record-popover__title">🏆 Günün Rekoru</div>
                    <div className="record-popover__user">
                      <strong>{dailyRecordHolder.username}</strong> — {dailyRecordHolder.minGuesses} tahmin
                    </div>

                    {dailyRecordHolder.path && (
                      <div className="record-popover__path">En kısa yolu: <br /> {dailyRecordHolder.path.replaceAll(", ", " → ")}</div>
                    )}
                  </>
                ) : (
                  <div className="record-popover__empty">Daha kimse günün bulmacasını çözemedi</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bağlananlar ve Bağlanmayanlar */}
      <div className="sidebar__section sidebar__section--results">
        <div className="sidebar__label">Bağlananlar ve Bağlanmayanlar</div>

        {selectedNode ? (
          <>
            <div className="selected-word-header">
              <span className={`selected-word-badge bg-node-${getNodeSide(selectedNode)}`}>
                {selectedNode}
              </span>
            </div>
            <p className="links-info">
              İki kelime arasındaki benzerlik %26'nın üzerinde ise bağlantı oluşur.
            </p>
            <div className="links-table" ref={scrollRef}>
              {selectedNodeSimilarities.length > 0 ? (
                selectedNodeSimilarities.map((sim, i) => {
                  const otherWord =
                    sim.word1 === selectedNode ? sim.word2 : sim.word1;
                  const side = getRowSide(selectedNode, otherWord);
                  return (
                    <div
                      key={i}
                      className={`link-row ${sim.is_link ? `link-row--linked-${side}` : ''}`}
                    >
                      <span className="link-row__word">
                        {selectedNode}
                      </span>
                      <span className="link-row__dash">—</span>
                      <span
                        className="link-row__word link-row__word--clickable"
                        onClick={() => onSelectNode(otherWord)}
                        title={`${otherWord} için benzerlikleri göster`}
                      >
                        {otherWord}
                      </span>
                      <div className="link-row__actions">
                        {!sim.is_link ? (
                          <button
                            className="link-row__add-btn"
                            onClick={() => openReportModal(selectedNode, otherWord)}
                            title="Bağlantı öner"
                          >
                            <Plus size={16} />
                          </button>
                        ) : (
                          <div style={{ width: '16px', marginLeft: '8px' }} />
                        )}
                        <span className="link-row__score">
                          %{sim.similarity.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="links-info">
                  Bu kelime için benzerlik verisi yok.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="links-info">
            Benzerlik skorlarını görmek için tahtadaki bir kelimeye tıklayın.
          </p>
        )}
      </div>

      {/* Sidebar Ad */}
      <div className="sidebar-ad">
        <AdUnit
          slotId="4623860650"
          format="rectangle"
          responsive={true}
        />
      </div>

      {reportModalOpen && (
        <div className={`report-modal-overlay ${reportModalClosing ? 'closing' : ''}`}>
          <div className="report-modal">
            {reportSuccess ? (
              <div className="report-modal__success">
                Raporunuz gönderildi! Teşekkürler.
              </div>
            ) : (
              <>
                <h3 className="report-modal__title">Özel Bağlantı Önerisi</h3>
                <p className="report-modal__desc">
                  "{reportWord1}" ve "{reportWord2}" arasında bağlantı olması gerektiğini mi düşünüyorsun?
                </p>
                <textarea
                  className="report-modal__input"
                  placeholder="Lütfen sebebini yazın."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={3}
                  maxLength={100}
                  style={{ resize: 'none' }}
                />
                {reportError && <div className="report-modal__error">{reportError}</div>}
                <div className="report-modal__actions">
                  <button className="report-modal__btn report-modal__btn--cancel" onClick={closeReportModal}>Kapat</button>
                  <button
                    className="report-modal__btn report-modal__btn--submit"
                    onClick={handleReportSubmit}
                    disabled={isSubmittingReport}
                  >
                    {isSubmittingReport ? 'Gönderiliyor...' : 'Raporu Gönder'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
