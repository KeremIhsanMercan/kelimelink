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
  source: string | GraphNode;
  target: string | GraphNode;
  similarity: number;
}

export function getLinkId(link: GraphLink): string {
    const s = typeof link.source === 'object' ? link.source.id : link.source;
    const t = typeof link.target === 'object' ? link.target.id : link.target;
    return [s, t].sort().join('-');
}

export function buildAdjacency(links: GraphLink[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const link of links) {
    const s = typeof link.source === 'object' ? link.source.id : link.source;
    const t = typeof link.target === 'object' ? link.target.id : link.target;
    if (!adj.has(s)) adj.set(s, new Set());
    if (!adj.has(t)) adj.set(t, new Set());
    adj.get(s)!.add(t);
    adj.get(t)!.add(s);
  }
  return adj;
}

export function bfs(start: string, adj: Map<string, Set<string>>): Set<string> {
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

export function findShortestPath(
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

export function updateChainSides(
  nodes: GraphNode[],
  links: GraphLink[],
  wordA: string,
  wordB: string
): GraphNode[] {
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
}
