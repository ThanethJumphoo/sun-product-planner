import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

const nodeWidth = 250;
const nodeHeight = 250;
const nodeSep = 150;
const rankSep = 100;

export const getHandleOrder = (handle?: string | null): number => {
  if (!handle) return 99;
  const h = handle.toLowerCase().replace(/[-_\s]/g, '');
  if (h.includes('product') && !h.includes('co') && !h.includes('by')) return 1;
  if (h.includes('coproduct')) return 2;
  if (h.includes('byproduct')) return 3;
  return 99;
};

function adjustBranchOrdering(
  nodes: Node[],
  edges: Edge[],
  positions: Map<string, { x: number; y: number }>,
  isHorizontal: boolean
) {
  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));

  // Adjacency list for downstream reachability
  const outgoing = new Map<string, Edge[]>();
  nodes.forEach((n) => outgoing.set(n.id, []));
  edges.forEach((e) => {
    if (outgoing.has(e.source)) {
      outgoing.get(e.source)!.push(e);
    }
  });

  const getDescendants = (startId: string): Set<string> => {
    const visited = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (!visited.has(curr)) {
        visited.add(curr);
        const nextEdges = outgoing.get(curr) || [];
        nextEdges.forEach((e) => {
          if (!visited.has(e.target)) queue.push(e.target);
        });
      }
    }
    return visited;
  };

  // Find parents that have multiple outgoing edges with ordered handles.
  // Sort parents by depth (descending) to process bottom-up.
  const parentsWithOrderedHandles = nodes
    .filter((n) => {
      const outEdges = outgoing.get(n.id) || [];
      const orderedEdges = outEdges.filter((e) => getHandleOrder(e.sourceHandle) < 99);
      const orders = new Set(orderedEdges.map((e) => getHandleOrder(e.sourceHandle)));
      return orders.size >= 2;
    })
    .sort((a, b) => {
      const posA = positions.get(a.id);
      const posB = positions.get(b.id);
      if (!posA || !posB) return 0;
      return isHorizontal ? posB.x - posA.x : posB.y - posA.y;
    });

  parentsWithOrderedHandles.forEach((parentNode) => {
    const outEdges = outgoing.get(parentNode.id) || [];
    const orderedOutEdges = outEdges
      .filter((e) => getHandleOrder(e.sourceHandle) < 99)
      .sort((a, b) => getHandleOrder(a.sourceHandle) - getHandleOrder(b.sourceHandle));

    // Get exclusive branches for each child
    const branches = orderedOutEdges.map((edge) => {
      const descendants = getDescendants(edge.target);
      return {
        edge,
        childId: edge.target,
        descendants,
        order: getHandleOrder(edge.sourceHandle),
      };
    });

    // Remove any nodes that appear in multiple branches (e.g. downstream joins)
    branches.forEach((b1, idx1) => {
      branches.forEach((b2, idx2) => {
        if (idx1 !== idx2) {
          b1.descendants.forEach((nodeId) => {
            if (b2.descendants.has(nodeId)) {
              b1.descendants.delete(nodeId);
            }
          });
        }
      });
    });

    // Compute bounding box for each branch along the primary layout axis
    const branchBoxes = branches.map((b) => {
      let minCoord = Infinity;
      let maxCoord = -Infinity;
      b.descendants.forEach((nodeId) => {
        const p = positions.get(nodeId);
        if (!p) return;
        const n = nodeMap.get(nodeId);
        const size = isHorizontal
          ? (n?.measured?.height ?? nodeHeight)
          : (n?.measured?.width ?? nodeWidth);
        const coord = isHorizontal ? p.y : p.x;
        minCoord = Math.min(minCoord, coord - size / 2);
        maxCoord = Math.max(maxCoord, coord + size / 2);
      });
      return {
        ...b,
        minCoord,
        maxCoord,
        size: maxCoord - minCoord,
        centerCoord: (minCoord + maxCoord) / 2,
      };
    });

    // Check if order is violated
    let isViolated = false;
    for (let i = 0; i < branchBoxes.length - 1; i++) {
      if (branchBoxes[i].centerCoord > branchBoxes[i + 1].centerCoord) {
        isViolated = true;
        break;
      }
    }

    if (!isViolated) return;

    // Arrange branches strictly left-to-right (or top-to-bottom) centered under the parent
    const totalSpan =
      branchBoxes.reduce((sum, b) => sum + b.size, 0) +
      (branchBoxes.length - 1) * nodeSep;

    const parentPos = positions.get(parentNode.id);
    let currentCoord = parentPos
      ? (isHorizontal ? parentPos.y : parentPos.x) - totalSpan / 2
      : Math.min(...branchBoxes.map((b) => b.minCoord));

    branchBoxes.forEach((b) => {
      const shift = currentCoord - b.minCoord;
      b.descendants.forEach((nodeId) => {
        const p = positions.get(nodeId);
        if (!p) return;
        if (isHorizontal) {
          p.y += shift;
        } else {
          p.x += shift;
        }
      });
      currentCoord += b.size + nodeSep;
    });
  });

  // Ensure minimum padding from origin (50px)
  let minAllX = Infinity;
  let minAllY = Infinity;
  nodes.forEach((n) => {
    const p = positions.get(n.id);
    if (!p) return;
    const w = n.measured?.width ?? nodeWidth;
    const h = n.measured?.height ?? nodeHeight;
    minAllX = Math.min(minAllX, p.x - w / 2);
    minAllY = Math.min(minAllY, p.y - h / 2);
  });

  if (minAllX < 50) {
    const shiftX = 50 - minAllX;
    positions.forEach((p) => {
      p.x += shiftX;
    });
  }

  if (minAllY < 50) {
    const shiftY = 50 - minAllY;
    positions.forEach((p) => {
      p.y += shiftY;
    });
  }
}

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  
  // Fresh graph instance on every layout run to avoid cross-board graph contamination
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction, 
    nodesep: nodeSep, 
    ranksep: rankSep 
  });

  nodes.forEach((node) => {
    const width = node.measured?.width ?? nodeWidth;
    const height = node.measured?.height ?? nodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  const sortedEdges = [...edges].sort((a, b) => {
    if (a.source === b.source) {
      return getHandleOrder(a.sourceHandle) - getHandleOrder(b.sourceHandle);
    }
    return 0;
  });

  sortedEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Collect initial positions from Dagre
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    positions.set(node.id, {
      x: nodeWithPosition.x,
      y: nodeWithPosition.y,
    });
  });

  // Post-process positions to guarantee handle order
  adjustBranchOrdering(nodes, edges, positions, isHorizontal);

  const newNodes = nodes.map((node) => {
    const pos = positions.get(node.id)!;
    const width = node.measured?.width ?? nodeWidth;
    const height = node.measured?.height ?? nodeHeight;
    
    return {
      ...node,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

