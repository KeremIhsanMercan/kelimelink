import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { forceCollide } from 'd3-force';
import type { GraphNode, GraphLink } from '../hooks/useGameState';

interface GraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  isSolved: boolean;
  shortestPath: string[] | null;
  selectedNode: string | null;
  onNodeClick: (nodeId: string) => void;
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

function getNodeColor(node: GraphNode, isOnPath: boolean) {
  if (isOnPath) return COLORS.path;
  return COLORS[node.chainSide] ?? COLORS.none;
}

/* ============================================
   Sabitler
   ============================================ */
const MIN_LINK_DISTANCE = 180;
const MIN_ZOOM = 0.8;

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
}: GraphCanvasProps) {
  const fgRef = useRef<ForceGraphMethods>(undefined!);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  /* ---- Kısa yol setleri ---- */
  const pathSet = useMemo(() => {
    return shortestPath ? new Set(shortestPath) : new Set<string>();
  }, [shortestPath]);

  const pathEdges = useMemo(() => {
    if (!shortestPath || shortestPath.length < 2) return new Set<string>();
    const s = new Set<string>();
    for (let i = 0; i < shortestPath.length - 1; i++) {
      s.add(`${shortestPath[i]}-${shortestPath[i + 1]}`);
      s.add(`${shortestPath[i + 1]}-${shortestPath[i]}`);
    }
    return s;
  }, [shortestPath]);

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
    fg.d3Force('charge', null);
    fg.d3Force('center', null);

    // Çarpışma: düğümler üst üste binmez
    fg.d3Force('collide',
      forceCollide<GraphNode & { x: number; y: number }>((node) =>
        getNodeHalfWidth(node.word) + 16
      ).strength(0.9).iterations(4)
    );

    // Dinamik sınır kutusu (minZoom referans alınarak)
    const boundX = (dimensions.width / MIN_ZOOM) / 2;
    const boundY = (dimensions.height / MIN_ZOOM) / 2;

    // Sınır kutusu
    fg.d3Force('box', forceBoundingBox(boundX, boundY));

    fg.d3ReheatSimulation();
  }, [dimensions]);

  // Grafik verisi değiştiğinde (yeni kelime, vs.) kuvvetleri yeniden uygula
  useEffect(() => { applyForces(); }, [graphData, applyForces]);

  // İlk mount sonrası da uygula (fgRef hazır olunca)
  const handleEngineStop = useCallback(() => {
    // Sınır kutusu kuvveti (forceBoundingBox) sınırları koruduğu için
    // burada ek bir işlem yapmamıza gerek kalmadı.
  }, []);

  /* ---- Kazanma: yeniden düzenle ---- */
  useEffect(() => {
    if (isSolved && fgRef.current) {
      setTimeout(() => {
        fgRef.current?.d3ReheatSimulation();
        setTimeout(() => fgRef.current?.zoomToFit(600, 60), 800);
      }, 300);
    }
  }, [isSolved]);

  /* ---- Düğüm çizimi ---- */
  const paintNode = useCallback((
    node: GraphNode & { x: number; y: number },
    ctx: CanvasRenderingContext2D
  ) => {
    const hw = getNodeHalfWidth(node.word);
    const hh = 15;
    const isOnPath = isSolved && pathSet.has(node.id);
    const colors = getNodeColor(node, isOnPath);
    const isStarting = node.type === 'start_a' || node.type === 'start_b';
    const isSelected = node.id === selectedNode;

    ctx.beginPath();
    ctx.ellipse(node.x, node.y, hw, hh, 0, 0, 2 * Math.PI);
    ctx.fillStyle = colors.fill;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = isStarting || isOnPath || isSelected ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = colors.text;
    ctx.font = `${isStarting || isSelected ? '600' : '500'} 11px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.word, node.x, node.y);
  }, [isSolved, pathSet, selectedNode]);

  /* ---- Sınır kutusu çizimi (debug için siyah, görünür olacak şekilde) ---- */
  const paintBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = dimensions.width;
    const h = dimensions.height;
    if (w === 0 || h === 0) return;

    const boundX = (w / MIN_ZOOM) / 2;
    const boundY = (h / MIN_ZOOM) / 2;

    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(-boundX, -boundY, boundX * 2, boundY * 2);
    ctx.restore();
  }, [dimensions]);

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
    const isPath = isSolved && pathEdges.has(`${srcId}-${tgtId}`);

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = isPath ? '#059669' : '#d1d5db';
    ctx.lineWidth = isPath ? 3 : 1;
    ctx.stroke();
  }, [isSolved, pathEdges]);

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
    (node: GraphNode) => onNodeClick(node.id),
    [onNodeClick]
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
    const boundX = (dimensions.width / MIN_ZOOM) / 2;
    const boundY = (dimensions.height / MIN_ZOOM) / 2;
    node.fx = Math.max(-boundX + hw, Math.min(boundX - hw, node.x));
    node.fy = Math.max(-boundY + 15, Math.min(boundY - 15, node.y));
  }, [dimensions]);

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
  const handleZoomEnd = useCallback(({ k, x, y }: { k: number; x: number; y: number }) => {
    if (isFixingPan.current) return;
    const fg = fgRef.current;
    if (!fg) return;

    const w = dimensions.width;
    const h = dimensions.height;
    if (w === 0 || h === 0) return;

    // react-force-graph onZoom/onZoomEnd x ve y değerlerini kameranın merkezinin dünya koordinatları olarak döndürür
    let cx = x;
    let cy = y;

    const boundX = (w / MIN_ZOOM) / 2;
    const boundY = (h / MIN_ZOOM) / 2;

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
  }, [dimensions]);

  const ready = dimensions.width > 0 && dimensions.height > 0;

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
          backgroundColor="#fafafa"
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.45}
          cooldownTicks={150}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          minZoom={MIN_ZOOM}
          maxZoom={2}
        />
      )}
    </div>
  );
}
