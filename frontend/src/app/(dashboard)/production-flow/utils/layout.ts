import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 250;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction, 
    nodesep: 150, 
    ranksep: 100 
  });

  nodes.forEach((node) => {
    // Use React Flow's measured dimensions if available, otherwise fallback
    const width = node.measured?.width ?? nodeWidth;
    const height = node.measured?.height ?? nodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  const handleOrder: Record<string, number> = {
    'product': 1,
    'co-product': 2,
    'coproduct': 2,
    'by-product': 3,
    'byproduct': 3,
  };

  const sortedEdges = [...edges].sort((a, b) => {
    if (a.source === b.source) {
      return (handleOrder[a.sourceHandle || ''] || 99) - (handleOrder[b.sourceHandle || ''] || 99);
    }
    return 0;
  });

  sortedEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.measured?.width ?? nodeWidth;
    const height = node.measured?.height ?? nodeHeight;
    
    const newNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};
