import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ResizableImageNodeView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { src, alt, width, align } = node.attrs;
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleAlign = (newAlign: string) => {
    updateAttributes({ align: newAlign });
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = containerRef.current?.offsetWidth || 0;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerWidth = containerRef.current.parentElement?.offsetWidth || 800;
      
      let deltaX = e.clientX - startXRef.current;
      if (align === 'center') {
        deltaX *= 2;
      } else if (align === 'right') {
        deltaX = -deltaX;
      }
      
      const newWidth = Math.max(100, Math.min(startWidthRef.current + deltaX, containerWidth));
      updateAttributes({ width: newWidth });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, align, updateAttributes]);

  const alignmentClass = 
    align === 'left' ? 'justify-start' : 
    align === 'right' ? 'justify-end' : 
    'justify-center';

  return (
    <NodeViewWrapper className={cn("flex w-full my-4 relative group", alignmentClass)}>
      <div 
        ref={containerRef}
        className={cn("relative", selected ? "ring-2 ring-indigo-500 rounded-lg" : "")}
        style={{ width: width === '100%' ? '100%' : `${width}px` }}
      >
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-auto rounded-lg block" 
        />
        
        {/* Toolbar */}
        {editor.isEditable && selected && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white shadow-lg border border-slate-200 rounded-lg p-1 flex items-center gap-1 z-50">
            <button onClick={() => handleAlign('left')} className={cn("p-1.5 rounded hover:bg-slate-100", align === 'left' && "bg-slate-100 text-indigo-600")}><AlignLeft size={16} /></button>
            <button onClick={() => handleAlign('center')} className={cn("p-1.5 rounded hover:bg-slate-100", align === 'center' && "bg-slate-100 text-indigo-600")}><AlignCenter size={16} /></button>
            <button onClick={() => handleAlign('right')} className={cn("p-1.5 rounded hover:bg-slate-100", align === 'right' && "bg-slate-100 text-indigo-600")}><AlignRight size={16} /></button>
          </div>
        )}

        {/* Resize Handle */}
        {editor.isEditable && selected && (
          <div 
            className={cn(
              "absolute bottom-0 w-4 h-4 bg-indigo-500 cursor-ew-resize",
              align === 'right' ? "left-0 rounded-bl-lg rounded-tr-lg" : "right-0 rounded-br-lg rounded-tl-lg"
            )}
            onMouseDown={startResize}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}
