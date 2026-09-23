import React, { useState, useRef } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: any) {
  const { setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isLocked = data?.isLocked;

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsHovered(false), 150);
  };

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    if (isLocked) return;
    if (window.confirm("Are you sure you want to delete this connection?")) {
      setEdges((edges) => edges.filter((e) => e.id !== id));
    }
  };

  return (
    <g onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {/* Invisible wider path to make hovering easier */}
      <path d={edgePath} fill="none" strokeOpacity={0} strokeWidth={20} className="react-flow__edge-interaction" />
      
      {!isLocked && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
              zIndex: 1000,
            }}
            className="nodrag nopan"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={onEdgeClick}
              className="w-5 h-5 bg-white border border-red-200 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-600 shadow-sm transition-colors cursor-pointer"
              title="Delete Connection"
            >
              <X size={12} strokeWidth={3} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}
