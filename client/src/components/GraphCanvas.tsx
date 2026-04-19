import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { forceCollide, forceManyBody } from 'd3-force';
import type { GraphNode, GraphLink, WinAnimationPhase } from '../hooks/useGameState';

interface GraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  isSolved: boolean;
  shortestPath: string[] | null;
  selectedNode: string | null;
  onNodeClick: (nodeId: string) => void;
  winAnimationPhase: WinAnimationPhase;
  winShortestPath: string[] | null;
  preWinChainSides: Record<string, GraphNode['chainSide']> | null;
  onWinAnimationFinish: () => void;
}

/* ============================================
   Renk tanımları
   ============================================ */
const COLORS = {
  a: { stroke: '#2563eb', fill: '#eff6ff', text: '#1e40af' },
  b: { stroke: '#dc2626', fill: '#fef2f2', text: '#991b1b' },
  both: { stroke: '#7c3aed', fill: '#f5f3ff', text: '#5b21b6' },
  none: { stroke: '#9ca3af', fill: '#f9fafb', text: '#4b5563' },
  path: { stroke: '#059669', fill: '#ecfdf5', text: '#065f46' },
};

// Purple target for the color transition during win animation
const PURPLE_COLOR = { stroke: '#7c3aed', fill: '#f5f3ff', text: '#5b21b6' };

function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getNodeColor(node: GraphNode, isOnPath: boolean) {
  if (isOnPath) return COLORS.path;
  return COLORS[node.chainSide] ?? COLORS.none;
}

/** Returns a blended color for non-path nodes during the win animation (towards purple) */
function getAnimatedNodeColor(
  chainSide: GraphNode['chainSide'],
  purpleProgress: number
): { stroke: string; fill: string; text: string } {
  const base = COLORS[chainSide] ?? COLORS.none;
  // Only shift blue (a) and red (b) nodes toward purple
  if (chainSide !== 'a' && chainSide !== 'b') return base;
  return {
    stroke: lerpColor(base.stroke, PURPLE_COLOR.stroke, purpleProgress),
    fill: lerpColor(base.fill, PURPLE_COLOR.fill, purpleProgress),
    text: lerpColor(base.text, PURPLE_COLOR.text, purpleProgress),
  };
}

/* ============================================
   Sabitler
   ============================================ */
const MIN_LINK_DISTANCE = 100;
const MIN_ZOOM = 0.8;
const STEP_DELAY_MS = 700; // delay between each path step

function getDynamicBounds(w: number, h: number, nodeCount: number) {
  if (w === 0 || h === 0) return { boundX: 0, boundY: 0, minZoom: MIN_ZOOM };
  const baseBoundX = (w / MIN_ZOOM) / 2;
  const baseBoundY = (h / MIN_ZOOM) / 2;
  const expansion = Math.max(1, Math.sqrt(nodeCount / 15));
  const boundX = Math.max(baseBoundX, 500) * expansion;
  const boundY = Math.max(baseBoundY, 500) * expansion;
  const minZoom = Math.max(0.15, MIN_ZOOM / expansion);
  return { boundX, boundY, minZoom };
}

/* Düğüm boyutu (kelime uzunluğuna göre) */
function getNodeHalfWidth(word: string) {
  return Math.max(word.length * 7.5 + 20, 50) / 2;
}

/* ============================================
   Özel Kuvvet: Sınır Kutusu
   ============================================ */
function forceBoundingBox(boundX: number, boundY: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nodes: any[] = [];
  function force() {
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      if (node.type === 'start_a' || node.type === 'start_b') continue;
      const hw = Math.max((node.word?.length || 0) * 7.5 + 20, 50) / 2;
      const hh = 15;

      if (node.x < -boundX + hw) { node.x = -boundX + hw; node.vx = 0; }
      if (node.x > boundX - hw) { node.x = boundX - hw; node.vx = 0; }
      if (node.y < -boundY + hh) { node.y = -boundY + hh; node.vy = 0; }
      if (node.y > boundY - hh) { node.y = boundY - hh; node.vy = 0; }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  force.initialize = function (_nodes: any[]) {
    nodes = _nodes;
  };
  return force;
}

/* ============================================
   Bileşen
   ============================================ */
export default function GraphCanvas({
  nodes,
  links,
  isSolved,
  shortestPath,
  selectedNode,
  onNodeClick,
  winAnimationPhase,
  winShortestPath,
  preWinChainSides,
  onWinAnimationFinish,
}: GraphCanvasProps) {
  const fgRef = useRef<ForceGraphMethods>(undefined!);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  /* ---- Win animation state ---- */
  // How many nodes of the path have been revealed so far (0 = none, path.length = all)
  const [animRevealedSteps, setAnimRevealedSteps] = useState(0);
  // Progress of the purple color shift [0..1]
  const [purpleProgress, setPurpleProgress] = useState(0);
  // Timestamp for pulsating glow
  const [animTime, setAnimTime] = useState(0);

  /* ---- Boyut izleme ---- */
  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setDimensions({ width: r.width, height: r.height });
    }
    const t = setTimeout(updateSize, 50);
    window.addEventListener('resize', updateSize);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateSize); };
  }, []);

  /* ---- Win animation orchestrator ---- */
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFinalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (winAnimationPhase !== 'highlighting' || !winShortestPath || winShortestPath.length === 0) {
      return;
    }

    const totalSteps = winShortestPath.length;

    // Small initial delay, then start stepping
    const initialDelay = setTimeout(() => {
      let step = 0;
      animIntervalRef.current = setInterval(() => {
        step++;
        setAnimRevealedSteps(step);
        // Purple progress ramps from 0 to 1 over the course of the animation
        setPurpleProgress(Math.min(step / totalSteps, 1));

        if (step >= totalSteps) {
          if (animIntervalRef.current) clearInterval(animIntervalRef.current);
          animIntervalRef.current = null;
          // Wait a moment after the last step, then finish
          animFinalTimeoutRef.current = setTimeout(() => {
            onWinAnimationFinish();
            animFinalTimeoutRef.current = null;
          }, 800);
        }
      }, STEP_DELAY_MS);
    }, 600);

    return () => {
      clearTimeout(initialDelay);
      if (animIntervalRef.current) { clearInterval(animIntervalRef.current); animIntervalRef.current = null; }
      if (animFinalTimeoutRef.current) { clearTimeout(animFinalTimeoutRef.current); animFinalTimeoutRef.current = null; }
    };
  }, [winAnimationPhase, winShortestPath, onWinAnimationFinish]);

  /* ---- Pulsating glow timer during animation ---- */
  useEffect(() => {
    if (winAnimationPhase !== 'highlighting') {
      return;
    }
    let raf: number;
    const tick = () => {
      setAnimTime(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [winAnimationPhase]);

  /* ---- Kısa yol setleri ---- */
  // Build path sets from either the final solved state or the animation progress
  const animPathNodes = useMemo(() => {
    if (winAnimationPhase === 'highlighting' && winShortestPath) {
      return new Set(winShortestPath.slice(0, animRevealedSteps));
    }
    return shortestPath ? new Set(shortestPath) : new Set<string>();
  }, [winAnimationPhase, winShortestPath, animRevealedSteps, shortestPath]);

  const animPathEdges = useMemo(() => {
    const s = new Set<string>();
    if (winAnimationPhase === 'highlighting' && winShortestPath) {
      for (let i = 0; i < animRevealedSteps - 1; i++) {
        s.add(`${winShortestPath[i]}-${winShortestPath[i + 1]}`);
        s.add(`${winShortestPath[i + 1]}-${winShortestPath[i]}`);
      }
      return s;
    }
    if (!shortestPath || shortestPath.length < 2) return s;
    for (let i = 0; i < shortestPath.length - 1; i++) {
      s.add(`${shortestPath[i]}-${shortestPath[i + 1]}`);
      s.add(`${shortestPath[i + 1]}-${shortestPath[i]}`);
    }
    return s;
  }, [winAnimationPhase, winShortestPath, animRevealedSteps, shortestPath]);

  // The "just revealed" node (for pulsating glow)
  const latestRevealedNode = useMemo(() => {
    if (winAnimationPhase === 'highlighting' && winShortestPath && animRevealedSteps > 0) {
      return winShortestPath[animRevealedSteps - 1];
    }
    return null;
  }, [winAnimationPhase, winShortestPath, animRevealedSteps]);

  /* ---- Grafik verisi ----
     Başlangıç düğümlerinin pozisyonlarını sabitliyoruz (x: -200 ve x: 200).
     Kullanıcı bunları sürükleyemez. */
  const graphData = useMemo(() => ({
    nodes: nodes.map((n) => {
      if (n.type === 'start_a') return { ...n, fx: -300, fy: -150 };
      if (n.type === 'start_b') return { ...n, fx: 300, fy: 150 };
      return { ...n };
    }),
    links: links.map((l) => ({ ...l })),
  }), [nodes, links]);

  /* ---- d3 kuvvet yapılandırması ---- */
  const applyForces = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;

    fg.d3Force('link')?.distance(() => MIN_LINK_DISTANCE);
    fg.d3Force('charge', forceManyBody().strength(-150).distanceMax(150));
    fg.d3Force('center', null);

    // Çarpışma: düğümler üst üste binmez
    fg.d3Force('collide',
      forceCollide<GraphNode & { x: number; y: number }>((node) =>
        getNodeHalfWidth(node.word) + 16
      ).strength(0.9).iterations(4)
    );

    // Dinamik sınır kutusu
    const { boundX, boundY } = getDynamicBounds(dimensions.width, dimensions.height, nodes.length);

    // Sınır kutusu
    fg.d3Force('box', forceBoundingBox(boundX, boundY));

    fg.d3ReheatSimulation();
  }, [dimensions, nodes.length]);

  // Grafik verisi değiştiğinde (yeni kelime, vs.) kuvvetleri yeniden uygula
  useEffect(() => { applyForces(); }, [graphData, applyForces]);

  // İlk mount sonrası da uygula (fgRef hazır olunca)
  const handleEngineStop = useCallback(() => {
    // Sınır kutusu kuvveti (forceBoundingBox) sınırları koruduğu için
    // burada ek bir işlem yapmamıza gerek kalmadı.
  }, []);


  /* ---- Düğüm çizimi ---- */
  const paintNode = useCallback((
    node: GraphNode & { x: number; y: number },
    ctx: CanvasRenderingContext2D
  ) => {
    const hw = getNodeHalfWidth(node.word);
    const hh = 15;
    const isHighlightingAnimation = winAnimationPhase === 'highlighting';
    const showPathColors = isSolved || isHighlightingAnimation;
    const isOnPath = showPathColors && animPathNodes.has(node.id);
    const isStarting = node.type === 'start_a' || node.type === 'start_b';
    const isSelected = node.id === selectedNode;
    const isLatestRevealed = node.id === latestRevealedNode;

    // During highlighting animation, blend non-path node colors toward purple
    let colors: { stroke: string; fill: string; text: string };
    if (isHighlightingAnimation && !isOnPath) {
      // Use pre-win chain side so we blend from original blue/red, not already-'both'
      const effectiveSide = (preWinChainSides && node.id in preWinChainSides)
        ? preWinChainSides[node.id]
        : node.chainSide;
      colors = getAnimatedNodeColor(effectiveSide, purpleProgress);
    } else if (isOnPath) {
      colors = COLORS.path;
    } else {
      colors = getNodeColor(node, false);
    }

    // Pulsating glow for the latest revealed node
    if (isLatestRevealed && isHighlightingAnimation) {
      const pulse = 0.5 + 0.5 * Math.sin(animTime * 0.006);
      const glowRadius = 6 + pulse * 8;
      const glowAlpha = 0.2 + pulse * 0.3;
      ctx.save();
      ctx.shadowColor = `rgba(5, 150, 105, ${glowAlpha})`;
      ctx.shadowBlur = glowRadius;
      ctx.beginPath();
      ctx.ellipse(node.x, node.y, hw + 3, hh + 3, 0, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(5, 150, 105, ${glowAlpha * 0.3})`;
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.ellipse(node.x, node.y, hw, hh, 0, 0, 2 * Math.PI);
    ctx.fillStyle = colors.fill;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = isStarting || isOnPath || isSelected || isLatestRevealed ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = colors.text;
    ctx.font = `${isStarting || isSelected ? '600' : '500'} 11px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.word, node.x, node.y);
  }, [isSolved, animPathNodes, selectedNode, winAnimationPhase, purpleProgress, latestRevealedNode, animTime, preWinChainSides]);

  /* ---- Sınır kutusu çizimi (debug için siyah, görünür olacak şekilde) ---- */
  const paintBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = dimensions.width;
    const h = dimensions.height;
    if (w === 0 || h === 0) return;

    const { boundX, boundY } = getDynamicBounds(w, h, nodes.length);

    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(-boundX, -boundY, boundX * 2, boundY * 2);
    ctx.restore();
  }, [dimensions, nodes.length]);

  /* ---- Kenar çizimi ---- */
  const paintLink = useCallback((
    link: {
      source: GraphNode & { x: number; y: number };
      target: GraphNode & { x: number; y: number };
      similarity: number;
    },
    ctx: CanvasRenderingContext2D
  ) => {
    const srcId = typeof link.source === 'object' ? link.source.id : (link.source as string);
    const tgtId = typeof link.target === 'object' ? link.target.id : (link.target as string);
    const isHighlightingAnimation = winAnimationPhase === 'highlighting';
    const showPathColors = isSolved || isHighlightingAnimation;
    const isPath = showPathColors && animPathEdges.has(`${srcId}-${tgtId}`);

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);

    if (isPath) {
      // Glow effect for path edges
      if (isHighlightingAnimation) {
        ctx.save();
        ctx.shadowColor = 'rgba(5, 150, 105, 0.4)';
        ctx.shadowBlur = 8;
      }
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (isHighlightingAnimation) {
        ctx.restore();
      }
    } else {
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [isSolved, animPathEdges, winAnimationPhase]);

  /* ---- Hit alanı ---- */
  const nodePointerAreaPaint = useCallback((
    node: GraphNode & { x: number; y: number },
    color: string,
    ctx: CanvasRenderingContext2D
  ) => {
    const hw = getNodeHalfWidth(node.word);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(node.x, node.y, hw, 15, 0, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  /* ---- Düğüm tıklama ---- */
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      // Disable clicks during win animation
      if (winAnimationPhase === 'highlighting') return;
      onNodeClick(node.id);
    },
    [onNodeClick, winAnimationPhase]
  );

  /* ---- Sürükleme sırasında: başlangıç kelimelerini sabitle, diğerlerini sınırla ---- */
  const handleNodeDrag = useCallback((
    node: GraphNode & { fx?: number; fy?: number; x: number; y: number }
  ) => {
    if (node.type === 'start_a') {
      node.fx = -300; node.fy = -150; node.x = -300; node.y = -150;
      return;
    }
    if (node.type === 'start_b') {
      node.fx = 300; node.fy = 150; node.x = 300; node.y = 150;
      return;
    }

    // Sürüklenen düğümü dinamik sınır içinde tut
    const hw = getNodeHalfWidth(node.word);
    const { boundX, boundY } = getDynamicBounds(dimensions.width, dimensions.height, nodes.length);
    node.fx = Math.max(-boundX + hw, Math.min(boundX - hw, node.x));
    node.fy = Math.max(-boundY + 15, Math.min(boundY - 15, node.y));
  }, [dimensions, nodes.length]);

  /* ---- Sürükleme bitti: başlangıç kelimelerini serbest bırakma, diğerlerini de ---- */
  const handleNodeDragEnd = useCallback((
    node: GraphNode & { fx?: number; fy?: number; x: number; y: number }
  ) => {
    if (node.type === 'start_a') { node.fx = -300; node.fy = -150; return; }
    if (node.type === 'start_b') { node.fx = 300; node.fy = 150; return; }

    // Normal düğümler: serbest bırak (simülasyon devam etsin)
    node.fx = undefined;
    node.fy = undefined;
  }, []);

  /* ---- Zoom/pan sınırlaması ----
     Kullanıcının kamerayı sınırların dışına kaydırmasını engeller. */
  const isFixingPan = useRef(false);
  // Use a ref so the callback identity stays stable across phase changes
  // (re-registering d3-zoom handlers causes event-stealing bugs)
  const winPhaseRef = useRef(winAnimationPhase);
  winPhaseRef.current = winAnimationPhase;

  const handleZoomEnd = useCallback(({ k, x, y }: { k: number; x: number; y: number }) => {
    if (isFixingPan.current) return;
    // Don't clamp during win highlight animation
    if (winPhaseRef.current === 'highlighting') return;
    const fg = fgRef.current;
    if (!fg) return;

    const w = dimensions.width;
    const h = dimensions.height;
    if (w === 0 || h === 0) return;

    // react-force-graph onZoom/onZoomEnd x ve y değerlerini kameranın merkezinin dünya koordinatları olarak döndürür
    let cx = x;
    let cy = y;

    const { boundX, boundY } = getDynamicBounds(w, h, nodes.length);

    const maxCx = Math.max(0, boundX - (w / k) / 2);
    const maxCy = Math.max(0, boundY - (h / k) / 2);

    let clamped = false;
    const eps = 0.5; // Kayan nokta hassasiyeti için küçük bir tolerans

    if (cx < -maxCx - eps) { cx = -maxCx; clamped = true; }
    else if (cx > maxCx + eps) { cx = maxCx; clamped = true; }

    if (cy < -maxCy - eps) { cy = -maxCy; clamped = true; }
    else if (cy > maxCy + eps) { cy = maxCy; clamped = true; }

    if (clamped) {
      isFixingPan.current = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fg as any).centerAt?.(cx, cy, 400); // 400ms animasyon ile yumuşakça sınıra geri çek
      setTimeout(() => { isFixingPan.current = false; }, 450); // Animasyon bitiminde kilidi aç
    }
  }, [dimensions, nodes.length]);

  const ready = dimensions.width > 0 && dimensions.height > 0;
  const { minZoom } = getDynamicBounds(dimensions.width, dimensions.height, nodes.length);

  return (
    <div className="graph-container" ref={containerRef}>
      {ready && (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeId="id"
          nodeCanvasObject={paintNode as unknown as (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => void}
          nodePointerAreaPaint={nodePointerAreaPaint as unknown as (node: object, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => void}
          linkCanvasObject={paintLink as unknown as (link: object, ctx: CanvasRenderingContext2D, globalScale: number) => void}
          onRenderFramePre={paintBackground as unknown as (ctx: CanvasRenderingContext2D, globalScale: number) => void}
          onNodeClick={handleNodeClick as unknown as (node: object, event: MouseEvent) => void}
          onNodeDrag={handleNodeDrag as unknown as (node: object, translate: { x: number; y: number }) => void}
          onNodeDragEnd={handleNodeDragEnd as unknown as (node: object, translate: { x: number; y: number }) => void}
          onEngineStop={handleEngineStop}
          onZoomEnd={handleZoomEnd as unknown as (transform: { k: number; x: number; y: number }) => void}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="transparent"
          d3AlphaDecay={0.03}
          d3VelocityDecay={0.55}
          cooldownTicks={150}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          minZoom={minZoom}
          maxZoom={2}
        />
      )}
    </div>
  );
}
