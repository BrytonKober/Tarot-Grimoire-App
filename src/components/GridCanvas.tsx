import React, { useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useGesture } from '@use-gesture/react';
import { Placeholder } from '../types';
import { CardPlaceholder } from './CardPlaceholder';
import { cn } from '../lib/utils';

interface GridCanvasProps {
  cards: Placeholder[];
  cellSize: number;
  onUpdateCard: (id: string, updates: Partial<Placeholder>) => void;
  onDeleteCard: (id: string) => void;
  selectedIds: Set<string>;
  activeId: string | null;
  dragDelta: { x: number, y: number } | null;
  onCardClick: (id: string, ctrlKey: boolean) => void;
  onClearSelection: () => void;
  onSetSelection: (ids: Set<string>) => void;
  zoom: number;
  setZoom: (zoom: number | ((z: number) => number)) => void;
  pan: { x: number, y: number };
  setPan: (pan: { x: number, y: number } | ((p: { x: number, y: number }) => { x: number, y: number })) => void;
}

export function GridCanvas({ 
  cards, cellSize, onUpdateCard, onDeleteCard,
  selectedIds, activeId, dragDelta, onCardClick, onClearSelection, onSetSelection,
  zoom, setZoom, pan, setPan
}: GridCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'grid-canvas',
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useGesture({
    onDrag: ({ offset: [x, y], event }) => {
      // Ignore if dragging a card
      if ((event.target as HTMLElement).closest('.card-element')) return;
      setPan({ x, y });
    },
    onWheel: ({ event, delta: [dx, dy], ctrlKey }) => {
      event.preventDefault();
      if (ctrlKey) {
        // Zoom
        const zoomDelta = -dy * 0.01;
        const newZoom = Math.max(0.1, Math.min(zoom + zoomDelta, 3));
        
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const pointerX = event.clientX - rect.left;
          const pointerY = event.clientY - rect.top;
          
          const scaleRatio = newZoom / zoom;
          const newPanX = pointerX - (pointerX - pan.x) * scaleRatio;
          const newPanY = pointerY - (pointerY - pan.y) * scaleRatio;
          
          setZoom(newZoom);
          setPan({ x: newPanX, y: newPanY });
        }
      } else {
        // Pan
        setPan(p => ({ x: p.x - dx, y: p.y - dy }));
      }
    },
    onPinch: ({ origin: [ox, oy], offset: [scale], event }) => {
      if (event) event.preventDefault();
      
      const newZoom = Math.max(0.1, Math.min(scale, 3));
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pointerX = ox - rect.left;
        const pointerY = oy - rect.top;
        
        const scaleRatio = newZoom / zoom;
        const newPanX = pointerX - (pointerX - pan.x) * scaleRatio;
        const newPanY = pointerY - (pointerY - pan.y) * scaleRatio;
        
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    }
  }, {
    target: containerRef,
    eventOptions: { passive: false },
    drag: { filterTaps: true, from: () => [pan.x, pan.y] },
    pinch: { scaleBounds: { min: 0.1, max: 3 }, modifierKey: null, from: () => [zoom, 0] }
  });

  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    setNodeRef(node);
  };

  return (
    <div
      ref={setRefs}
      className={cn(
        "w-full h-full overflow-hidden bg-slate-50 relative touch-none transition-colors",
        isOver && "bg-indigo-50/50"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClearSelection();
        }
      }}
    >
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {cards.map((card) => (
          <CardPlaceholder
            key={card.id}
            card={card}
            cellSize={cellSize}
            isSelected={selectedIds.has(card.id)}
            isActive={activeId === card.id}
            dragDelta={dragDelta}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
            onClick={(e) => onCardClick(card.id, e.ctrlKey || e.metaKey)}
            zoom={zoom}
          />
        ))}
      </div>
    </div>
  );
}
