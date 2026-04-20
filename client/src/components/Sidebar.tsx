import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import type { SimilarityResult } from '../services/api';
import type { GameMode } from '../hooks/useGameState';
import AdUnit from './AdUnit';
import { Trophy } from 'lucide-react';

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
  onAddWord: (word: string) => void;
  onSelectNode: (word: string) => void;
  gameMode: GameMode;
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
  onAddWord,
  onSelectNode,
  gameMode,
}: SidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!isGuessing && !isSolved && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGuessing, isSolved]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();

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
  }, []);

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

  const handleInputChange = (val: string) => {
    setInputValue(val);
    // Kullanıcı yazarken uyarıyı temizle
    if (localWarning) setLocalWarning(null);
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
            <Trophy size={16} /> Bulmaca çözüldü!
          </p>
        )}
      </div>

      {/* Bağlananlar ve Bağlanmayanlar */}
      <div className="sidebar__section sidebar__section--results">
        <div className="sidebar__label">Bağlananlar ve Bağlanmayanlar</div>

        {selectedNode ? (
          <>
            <div className="selected-word-header">
              <span className="selected-word-badge">{selectedNode}</span>
            </div>
            <p className="links-info">
              İki kelime arasındaki benzerlik %27.5'in üzerinde ise bağlantı oluşur.
            </p>
            <div className="links-table" ref={scrollRef}>
              {selectedNodeSimilarities.length > 0 ? (
                selectedNodeSimilarities.map((sim, i) => {
                  const otherWord =
                    sim.word1 === selectedNode ? sim.word2 : sim.word1;
                  return (
                    <div
                      key={i}
                      className={`link-row ${sim.is_link ? 'link-row--linked' : ''}`}
                    >
                      <span className="link-row__word">{selectedNode}</span>
                      <span className="link-row__dash">—</span>
                      <span
                        className="link-row__word link-row__word--clickable"
                        onClick={() => onSelectNode(otherWord)}
                        title={`${otherWord} için benzerlikleri göster`}
                      >
                        {otherWord}
                      </span>
                      <span className="link-row__score">
                        %{sim.similarity.toFixed(1)}
                      </span>
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
    </aside>
  );
}
