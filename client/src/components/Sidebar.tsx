import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import type { SimilarityResult } from '../services/api';

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
}

export default function Sidebar({
  wordA,
  wordB,
  nodeCount,
  guessCount,
  isSolved,
  isGuessing,
  error,
  selectedNode,
  selectedNodeSimilarities,
  onAddWord,
}: SidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [localWarning, setLocalWarning] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [selectedNode]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isGuessing || isSolved) return;

    // En az 3 karakter kontrolü
    if (trimmed.length < 3) {
      setLocalWarning('Kelime en az 3 harf içermelidir.');
      return;
    }

    setLocalWarning(null);
    onAddWord(trimmed);
    setInputValue('');
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
        <div className="sidebar__label">Günlük Bulmaca</div>
        <div className="starting-words">
          <span className="starting-word starting-word--a">{wordA}</span>
          <span className="starting-words__arrow">⟷</span>
          <span className="starting-word starting-word--b">{wordB}</span>
        </div>
      </div>

      {/* Kelime Ekleme */}
      <div className="sidebar__section">
        <div className="sidebar__label">Kelime Ekle</div>
        <form className="guess-form" onSubmit={handleSubmit}>
          <input
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
        <p className="status-text">
          Tahtada <strong>{nodeCount} kelime</strong> var.
        </p>
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
            }}
          >
            🞉 Bulmaca çözüldü!
          </p>
        )}
      </div>

      {/* Bağlananlar ve Bağlanmayanlar */}
      <div className="sidebar__section" style={{ flex: 1 }}>
        <div className="sidebar__label">Bağlananlar ve Bağlanmayanlar</div>

        {selectedNode ? (
          <>
            <div className="selected-word-header">
              <span className="selected-word-badge">{selectedNode}</span>
            </div>
            <p className="links-info">
              İki kelime arasındaki benzerlik %24'i geçerse bağlantı oluşur.
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
                      <span className="link-row__word">{otherWord}</span>
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
    </aside>
  );
}
