"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { DeletableEdge } from './components/DeletableEdge';
import { NodeModal } from './components/NodeModal';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

import { getLayoutedElements } from './utils/layout';

import { Lock, Unlock } from 'lucide-react';

// Define custom node types
const nodeTypes = {
  simulatorNode: SimulatorNode,
};

const edgeTypes = {
  deletableEdge: DeletableEdge,
};

export default function ProductionFlowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardId, setBoardId] = useState<number | null>(null);
  const [allBoards, setAllBoards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFlow, setIsSavingFlow] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [dbNodeTypes, setDbNodeTypes] = useState<any[]>([]);
  const [boardHistory, setBoardHistory] = useState<number[]>([]);

  const stateRef = useRef({ boardId, isLocked, nodes, edges, allBoards, dbNodeTypes });
  useEffect(() => {
    stateRef.current = { boardId, isLocked, nodes, edges, allBoards, dbNodeTypes };
  }, [boardId, isLocked, nodes, edges, allBoards, dbNodeTypes]);

  const handleEditNode = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
    setIsModalOpen(true);
  }, []);

  const handleDrillDown = useCallback(async (nodeId: string) => {
    const { boardId, isLocked, nodes, edges, allBoards, dbNodeTypes } = stateRef.current;
    
    if (!boardId || isLocked) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.data.dynamicData?.subBoardId) {
      const success = await loadBoard(node.data.dynamicData.subBoardId, dbNodeTypes, true);
      if (success) {
        setBoardHistory(prev => [...prev, boardId]);
        return;
      }
      // If it failed (e.g. board was deleted), fall through to generate a new board
    }

    // Generate new board
    setIsLoading(true);
    try {
      const parentBoardName = allBoards.find(b => b.id === boardId)?.name || 'Parent';
      const mainType = dbNodeTypes.find(t => t.typeCode === 'MAIN');
      const partType = dbNodeTypes.find(t => t.typeCode === 'PART');
      
      if (!mainType || !partType) {
        toast.error("Missing required node types (MAIN/PART) to generate sub-flow.");
        setIsLoading(false);
        return;
      }

      const mainId = `node_${Date.now()}_main`;
      const partId = `node_${Date.now()}_part`;

      // Find the parent node in the current flow to inherit its Yield Percent
      const incomingEdge = edges.find(e => e.target === node.id);
      const parentNode = incomingEdge ? nodes.find(n => n.id === incomingEdge.source) : null;
      // Use 'Yield Percent', 'YieldPercent', or default to 100
      let parentYield = 100;
      if (parentNode?.data?.dynamicData) {
        const yieldKey = Object.keys(parentNode.data.dynamicData).find(k => k.toLowerCase().includes('yield'));
        if (yieldKey) parentYield = Number(parentNode.data.dynamicData[yieldKey]) || 100;
      }

      const newBoardPayload = {
        name: `${parentBoardName} - ${node.data.name}`,
        nodes: [
          {
            id: mainId,
            nodeTypeId: parentNode ? parentNode.data.nodeTypeId : mainType.id,
            name: parentNode ? parentNode.data.name : 'Source (Parent Output)',
            positionX: 100,
            positionY: 100,
            data: JSON.stringify(parentNode ? parentNode.data.dynamicData : { 'inputQuantity': 100, 'Yield Percent': 100 })
          },
          {
            id: partId,
            nodeTypeId: partType.id,
            name: node.data.name,
            positionX: 100,
            positionY: 350,
            data: JSON.stringify(node.data.dynamicData)
          }
        ],
        edges: [
          {
            id: `edge_${Date.now()}`,
            source: mainId,
            target: partId
          }
        ]
      };

      const res = await api.post('/api/v1/simulator/boards', newBoardPayload);
      const newBoardId = res.data.id;

      // Update current node with subBoardId
      const updatedNodes = nodes.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              dynamicData: { ...n.data.dynamicData, subBoardId: newBoardId }
            }
          };
        }
        return n;
      });

      // Save parent board immediately
      const parentSavePayload = {
        name: parentBoardName,
        nodes: updatedNodes.map(n => ({
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
      await api.put(`/api/v1/simulator/boards/${boardId}/save`, parentSavePayload);

      toast.success("Sub-flow created successfully.");
      
      setBoardHistory(prev => [...prev, boardId]);
      await fetchBoardsList();
      await loadBoard(newBoardId, dbNodeTypes, true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create sub-flow');
      setIsLoading(false);
    }
  }, []); // Dependencies removed to rely on stateRef

  const fetchNodeTypes = async () => {
    try {
      const res = await api.get('/api/v1/simulator/node-types');
      setDbNodeTypes(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch node types", err);
      return [];
    }
  };

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

  const loadBoard = async (id: number, fetchedTypes?: any[], isSubFlowIndicator?: boolean) => {
    setIsLoading(true);
    try {
      const board = await api.get(`/api/v1/simulator/boards/${id}`);
      setBoardId(board.data.id);
      
      const currentTypes = fetchedTypes || dbNodeTypes;

      const loadedNodes: Node[] = board.data.nodes.map((n: any) => {
        // Find node type name from dbNodeTypes
        const typeMatch = currentTypes.find(t => t.id === n.nodeTypeId);
        return {
          id: n.id,
          type: 'simulatorNode',
          position: { x: n.positionX, y: n.positionY },
          data: {
            name: n.name,
            nodeTypeId: n.nodeTypeId,
            nodeTypeName: typeMatch?.typeName || 'Node',
            nodeTypeCode: typeMatch?.typeCode || '',
            dynamicData: n.data ? JSON.parse(n.data) : {},
            fieldSchema: typeMatch?.fields || [],
            onEdit: handleEditNode,
            onDrillDown: handleDrillDown,
            isLocked,
            isSubFlow: isSubFlowIndicator || false,
          },
        };
      });
      setNodes(loadedNodes);

      const loadedEdges: Edge[] = board.data.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined,
        type: 'deletableEdge',
        data: { isLocked },
      }));
      setEdges(loadedEdges);
      return true;
    } catch (err) {
      toast.error('Failed to load board details');
      return false;
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
      const types = await fetchNodeTypes();
      const boards = await fetchBoardsList();
      if (boards.length > 0) {
        const masterBoard = boards.find((b: any) => b.name === 'Master Production Flow');
        if (masterBoard) {
          await loadBoard(masterBoard.id, types);
        } else {
          await loadBoard(boards[0].id, types);
        }
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, [handleEditNode]);

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

    // Calculate Total Yield for PROCESS and MACHINE nodes
    const processYields: Record<string, number> = {};
    nodes.forEach(n => {
      const nodeType = n.data?.nodeTypeCode;
      if (nodeType === 'PROCESS' || nodeType === 'MACHINE') {
        const outgoingEdges = edges.filter(e => e.source === n.id);
        let totalYield = 0;
        outgoingEdges.forEach(e => {
          const targetNode = nodes.find(tn => tn.id === e.target);
          if (targetNode?.data?.dynamicData) {
            for (const [key, value] of Object.entries(targetNode.data.dynamicData)) {
              const fieldDef = targetNode.data.fieldSchema?.find((f: any) => f.fieldName === key);
              const isPercent = fieldDef ? fieldDef.dataType === 'PERCENT' : key.toLowerCase().includes('percent');
              if (isPercent) {
                totalYield += Number(value) || 0;
                break;
              }
            }
          }
        });
        processYields[n.id] = totalYield;
      }
    });

    // Apply outputs to nodes
    let changed = false;
    const newNodes = nodes.map(node => {
      const calculatedOutput = (outputs[node.id] || 0).toFixed(2);
      const processTotalYield = processYields[node.id];
      
      const incomingEdge = edges.find(e => e.target === node.id);
      const connectionType = incomingEdge?.sourceHandle || undefined;

      // Inject onEdit and isLocked
      if (
        node.data?.outputValue !== calculatedOutput || 
        node.data?.processTotalYield !== processTotalYield ||
        node.data?.connectionType !== connectionType ||
        node.data?.onEdit !== handleEditNode || 
        node.data?.isLocked !== isLocked || 
        node.data?.onDrillDown !== handleDrillDown
      ) {
        changed = true;
        return { ...node, data: { ...node.data, outputValue: calculatedOutput, processTotalYield, connectionType, onEdit: handleEditNode, onDrillDown: handleDrillDown, isLocked } };
      }
      return node;
    });

    if (changed) {
      setNodes(newNodes);
    }
  }, [nodes, edges, isLoading, setNodes, handleEditNode, handleDrillDown, isLocked]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      if (isLocked) return;
      setEdges((eds) => addEdge({ ...params, type: 'deletableEdge', data: { isLocked } }, eds));
    },
    [setEdges, isLocked],
  );

  const handleLayout = useCallback(
    (direction: string) => {
      if (isLocked) return;
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, isLocked]
  );

  const handleAddNode = (newNodeData: any) => {
    if (isLocked) return;
    
    if (editingNodeId) {
      setNodes(nds => nds.map(n => {
        if (n.id === editingNodeId) {
          return { ...n, data: { ...n.data, ...newNodeData } };
        }
        return n;
      }));
    } else {
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: 'simulatorNode',
        position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
        data: { ...newNodeData, onEdit: handleEditNode, onDrillDown: handleDrillDown, isLocked },
      };
      setNodes((nds) => [...nds, newNode]);
    }
    
    setIsModalOpen(false);
    setEditingNodeId(null);
  };

  const handleSave = async () => {
    if (isLocked) return;
    setIsSavingFlow(true);
    try {
      let boardName = allBoards.find(b => b.id === boardId)?.name || 'Master Production Flow';
      if (!boardId) {
        const input = prompt('Enter a name for the new board:');
        if (!input) {
          setIsSavingFlow(false);
          return; // Cancelled
        }
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
          sourceHandle: e.sourceHandle || null,
          targetHandle: e.targetHandle || null,
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
    } finally {
      setIsSavingFlow(false);
    }
  };

  const handleBack = async () => {
    if (boardHistory.length === 0 || isLocked) return;
    const previousBoardId = boardHistory[boardHistory.length - 1];
    setBoardHistory(prev => prev.slice(0, -1));
    await loadBoard(previousBoardId);
  };

  const handleDeleteBoard = async () => {
    if (isLocked || !boardId) return;
    
    const currentBoard = allBoards.find(b => b.id === boardId);
    if (currentBoard?.name === 'Master Production Flow') {
      toast.error('The Master Production Flow cannot be deleted.');
      return;
    }

    if (!window.confirm("Are you sure you want to delete this board? This action cannot be undone.")) return;

    try {
      setIsLoading(true);
      await api.delete(`/api/v1/simulator/boards/${boardId}`);
      toast.success('Board deleted successfully');
      
      const updatedBoards = await fetchBoardsList();
      
      // If we are in a subflow, try to go back to parent
      if (boardHistory.length > 0) {
        await handleBack();
      } else if (updatedBoards.length > 0) {
        await loadBoard(updatedBoards[0].id);
      } else {
        handleNewBoard();
      }
    } catch (err) {
      toast.error('Failed to delete board');
      setIsLoading(false);
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
            {boardHistory.length > 0 && (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors border border-border mr-2 disabled:opacity-50 flex items-center gap-1"
                disabled={isLocked || isLoading}
              >
                ← Back
              </button>
            )}
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
              className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors border border-slate-300 disabled:opacity-50"
              disabled={isLocked}
            >
              + New Board
            </button>
            {boardId && allBoards.find(b => b.id === boardId)?.name !== 'Master Production Flow' && (
              <button
                onClick={handleDeleteBoard}
                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium transition-colors border border-red-200 disabled:opacity-50"
                disabled={isLocked || isLoading}
                title="Delete this board"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors border ${
              isLocked 
                ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' 
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
            title={isLocked ? "Unlock Flow" : "Lock Flow"}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            {isLocked ? "Locked" : "Unlocked"}
          </button>
          
          <div className="h-6 w-px bg-border mx-1"></div>

          <button 
            onClick={() => handleLayout('TB')}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md font-medium transition-colors border border-slate-300 disabled:opacity-50"
            disabled={isLocked}
          >
            Auto Arrange
          </button>
          <button 
            onClick={() => {
              setEditingNodeId(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-md font-medium transition-colors disabled:opacity-50"
            disabled={isLocked}
          >
            Add Card
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
            disabled={isLocked || isSavingFlow}
          >
            {isSavingFlow ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Save Flow"
            )}
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
            onNodesChange={isLocked ? undefined : onNodesChange}
            onEdgesChange={isLocked ? undefined : onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ maxZoom: 0.8 }}
            nodesDraggable={!isLocked}
            nodesConnectable={!isLocked}
            elementsSelectable={!isLocked}
          >
            <Controls showInteractive={false} />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        )}
      </div>

      <NodeModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingNodeId(null);
        }} 
        onSave={handleAddNode}
        initialData={editingNodeId ? nodes.find(n => n.id === editingNodeId)?.data : undefined}
        nodeTypes={dbNodeTypes}
      />
    </div>
  );
}
