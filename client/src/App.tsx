import { useGameState } from './hooks/useGameState';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import WinBanner from './components/WinBanner';
import './index.css';

export default function App() {
  const {
    isLoading,
    error,
    wordA,
    wordB,
    nodes,
    links,
    guessCount,
    isSolved,
    showWinBanner,
    selectedNode,
    selectedNodeSimilarities,
    isGuessing,
    stats,
    addWord,
    selectNode,
    closeWinBanner,
    getShortestPath,
  } = useGameState();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Bulmaca yükleniyor...</p>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="loading-screen">
        <p className="loading-text" style={{ color: '#dc2626' }}>
          {error}
        </p>
      </div>
    );
  }

  const shortestPath = isSolved ? getShortestPath() : null;

  return (
    <div className="app-layout">
      {/* Üst Başlık */}
      <header className="app-header">
        <h1 className="app-header__title">Kelimelink</h1>
        <span className="app-header__subtitle">Kelime Bağlantı Bulmacası</span>
      </header>

      {/* Ana İçerik */}
      <main className="app-main">
        <Sidebar
          wordA={wordA}
          wordB={wordB}
          nodeCount={nodes.length}
          guessCount={guessCount}
          isSolved={isSolved}
          isGuessing={isGuessing}
          error={error}
          selectedNode={selectedNode}
          selectedNodeSimilarities={selectedNodeSimilarities}
          onAddWord={addWord}
        />
        <GraphCanvas
          nodes={nodes}
          links={links}
          isSolved={isSolved}
          shortestPath={shortestPath}
          selectedNode={selectedNode}
          onNodeClick={selectNode}
        />
      </main>

      {/* Kazanma Bannerı */}
      {showWinBanner && (
        <WinBanner
          guessCount={guessCount}
          stats={stats}
          onClose={closeWinBanner}
        />
      )}
    </div>
  );
}
