"use client";

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SimulatorNode } from './components/SimulatorNode';
import { NodeModal } from './components/NodeModal';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

import { getLayoutedElements } from './utils/layout';

// Define custom node types
const nodeTypes = {
  simulatorNode: SimulatorNode,
};

export default function ProductionFlowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [allBoards, setAllBoards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoardsList = async () => {
    try {
      const res = await api.get('/api/v1/simulator/boards');
      setAllBoards(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to load boards list', err);
      return [];
    }
  };

  const loadBoard = async (id: number) => {
    setIsLoading(true);
    try {
      const board = await api.get(`/api/v1/simulator/boards/${id}`);
      setBoardId(board.data.id);
      
      const loadedNodes: Node[] = board.data.nodes.map((n: any) => ({
        id: n.id,
        type: 'simulatorNode',
        position: { x: n.positionX, y: n.positionY },
        data: {
          name: n.name,
          nodeTypeId: n.nodeTypeId,
          dynamicData: n.data ? JSON.parse(n.data) : {},
        },
      }));
      setNodes(loadedNodes);

      const loadedEdges: Edge[] = board.data.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));
      setEdges(loadedEdges);
    } catch (err) {
      toast.error('Failed to load board details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewBoard = () => {
    setBoardId(null);
    setNodes([]);
    setEdges([]);
  };

  useEffect(() => {
    const init = async () => {
      const boards = await fetchBoardsList();
      if (boards.length > 0) {
        await loadBoard(boards[0].id);
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Calculation Engine
  useEffect(() => {
    if (isLoading || nodes.length === 0) return;

    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};
    nodes.forEach(n => { inDegree[n.id] = 0; adjList[n.id] = []; });
    
    edges.forEach(e => {
      if (inDegree[e.target] !== undefined) {
        inDegree[e.target]++;
        if (adjList[e.source]) adjList[e.source].push(e.target);
      }
    });

    const queue: string[] = [];
    const outputs: Record<string, number> = {};

    nodes.forEach(n => {
      if (inDegree[n.id] === 0) {
        queue.push(n.id);
        // Look for an 'Input' field on root nodes, otherwise default to 100
        let baseValue = 100;
        if (n.data?.dynamicData) {
           const inputField = Object.entries(n.data.dynamicData).find(([k]) => k.toLowerCase().includes('input'));
           if (inputField) baseValue = Number(inputField[1]) || 100;
        }
        outputs[n.id] = baseValue; 
      }
    });

    while(queue.length > 0) {
      const currId = queue.shift()!;
      const currOutput = outputs[currId] || 0;

      if (adjList[currId]) {
        adjList[currId].forEach(targetId => {
          const targetNode = nodes.find(n => n.id === targetId);
          if (targetNode) {
            let yieldPercent = 100;
            if (targetNode.data?.dynamicData) {
              for (const [key, value] of Object.entries(targetNode.data.dynamicData)) {
                const fieldDef = targetNode.data.fieldSchema?.find((f: any) => f.fieldName === key);
                const isPercent = fieldDef ? fieldDef.dataType === 'PERCENT' : key.toLowerCase().includes('percent');
                if (isPercent) {
                  yieldPercent = Number(value) || 0;
                  break;
                }
              }
            }
            
            const flowValue = currOutput * (yieldPercent / 100);
            outputs[targetId] = (outputs[targetId] || 0) + flowValue;

            inDegree[targetId]--;
            if (inDegree[targetId] === 0) {
              queue.push(targetId);
            }
          }
        });
      }
    }

    // Apply outputs to nodes
    let changed = false;
    const newNodes = nodes.map(node => {
      const calculatedOutput = (outputs[node.id] || 0).toFixed(2);
      if (node.data?.outputValue !== calculatedOutput) {
        changed = true;
        return { ...node, data: { ...node.data, outputValue: calculatedOutput } };
      }
      return node;
    });

    if (changed) {
      setNodes(newNodes);
    }
  }, [nodes, edges, isLoading, setNodes]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges]
  );

  const handleAddNode = (newNodeData: any) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'simulatorNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: newNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    try {
      let boardName = 'Master Production Flow';
      if (!boardId) {
        const input = prompt('Enter a name for the new board:');
        if (!input) return; // Cancelled
        boardName = input;
      }

      const payload = {
        name: boardName,
        nodes: nodes.map(n => ({
          id: n.id,
          nodeTypeId: n.data.nodeTypeId,
          name: n.data.name,
          positionX: n.position.x,
          positionY: n.position.y,
          data: JSON.stringify(n.data.dynamicData),
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
        }))
      };

      if (boardId) {
        await api.put(`/api/v1/simulator/boards/${boardId}/save`, payload);
      } else {
        const res = await api.post('/api/v1/simulator/boards', payload);
        setBoardId(res.data.id);
        fetchBoardsList(); // Refresh list
      }
      toast.success('Production flow saved successfully!');
    } catch (err) {
      toast.error('Failed to save flow');
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Production Flow Simulator</h1>
            <p className="text-sm text-muted-foreground">Design and visualize the production process</p>
          </div>
          
          <div className="h-10 w-px bg-border"></div>
          
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium min-w-[200px]"
              value={boardId || ''}
              onChange={(e) => e.target.value ? loadBoard(Number(e.target.value)) : handleNewBoard()}
            >
              <option value="">-- Unsaved New Board --</option>
              {allBoards.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button
              onClick={handleNewBoard}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors border border-slate-300"
            >
              + New Board
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleLayout('TB')}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-medium transition-colors border border-slate-300"
          >
            Auto Arrange
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md font-medium transition-colors"
          >
            Add Card
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors"
          >
            Save Flow
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative bg-slate-50">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-slate-500">Loading Production Flow...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ maxZoom: 0.8 }}
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        )}
      </div>

      <NodeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddNode} 
      />
    </div>
  );
}
