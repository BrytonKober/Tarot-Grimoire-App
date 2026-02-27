import React, { useRef, useState, useEffect } from 'react';
import { FloatingImage } from '../../lib/db';
import { Trash2, RotateCw, ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  image: FloatingImage;
  onUpdate: (id: string, updates: Partial<FloatingImage>) => void;
  onDelete: (id: string) => void;
  viewMode?: boolean;
  displayZIndex?: number;
}

export function FloatingImageComponent({ image, onUpdate, onDelete, viewMode, displayZIndex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate safe display values for mobile
  // Ensure the image isn't completely off-screen to the right
  // On tablet/mobile, we want to ensure the entire image is visible if possible,
  // or at least enough to grab it.
  const maxSafeX = Math.max(0, vw - image.width - 32); 
  const displayX = Math.min(image.x, maxSafeX);
  
  // Ensure the image isn't wider than the screen (minus some padding)
  const maxSafeWidth = vw - 32; 
  const isOversized = image.width > maxSafeWidth;
  const displayWidth = isOversized ? maxSafeWidth : image.width;
  const displayHeight = isOversized ? image.height * (maxSafeWidth / image.width) : image.height;
  const isMobileOrTablet = vw < 1024;

  if (viewMode && isMobileOrTablet) {
    const isLeft = displayX < vw / 2;
    
    return (
      <>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMobileOpen(true);
          }}
          className={cn(
            "group absolute p-3 bg-white/90 backdrop-blur-md text-indigo-600 shadow-lg border border-slate-200 transition-all duration-300 hover:bg-white active:scale-95 opacity-75 hover:opacity-100 hover-jiggle cursor-pointer",
            isLeft ? "left-0 -translate-x-2 hover:translate-x-0 rounded-r-xl border-l-0 origin-left" : "right-0 translate-x-2 hover:translate-x-0 rounded-l-xl border-r-0 origin-right"
          )}
          style={{ 
            top: image.y,
            zIndex: displayZIndex ?? 10
          }}
        >
          <ImageIcon size={24} />
        </button>

        {isMobileOpen && (
          <div 
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={() => setIsMobileOpen(false)}
          >
            <img 
              src={image.src} 
              alt="Scrapbook" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  if (viewMode && !isMobileOrTablet) {
    return (
      <div
        className="absolute group"
        style={{
          left: displayX,
          top: image.y,
          width: displayWidth,
          height: displayHeight,
          transform: `rotate(${image.rotation}deg)`,
          zIndex: displayZIndex ?? 10,
        }}
      >
        <div className="w-full h-full transition-opacity duration-300 group-hover:opacity-0">
          <img 
            src={image.src} 
            alt="Scrapbook" 
            className="w-full h-full object-cover rounded-md shadow-sm pointer-events-none"
          />
        </div>
      </div>
    );
  }

  const handlePointerDownDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = displayX;
    const initialY = image.y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      onUpdate(image.id, {
        x: initialX + (moveEvent.clientX - startX),
        y: initialY + (moveEvent.clientY - startY),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialWidth = displayWidth;
    const initialHeight = displayHeight;
    
    const aspect = initialWidth / initialHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(50, initialWidth + deltaX);
      const newHeight = newWidth / aspect;
      
      onUpdate(image.id, {
        width: newWidth,
        height: newHeight,
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePointerDownRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      let degrees = (angle * 180) / Math.PI + 90;
      onUpdate(image.id, { rotation: degrees });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      ref={containerRef}
      className="absolute group"
      style={{
        left: displayX,
        top: image.y,
        width: displayWidth,
        height: displayHeight,
        transform: `rotate(${image.rotation}deg)`,
        zIndex: displayZIndex ?? 10,
      }}
    >
      <div 
        className="w-full h-full cursor-move"
        onPointerDown={handlePointerDownDrag}
      >
        <img 
          src={image.src} 
          alt="Scrapbook" 
          className="w-full h-full object-cover rounded-md shadow-sm pointer-events-none"
        />
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border-2 border-indigo-500 rounded-md" />
        
        <button 
          className="absolute -top-3 -left-3 bg-white text-red-500 p-1.5 rounded-full shadow-md border border-slate-200 pointer-events-auto hover:bg-red-50"
          onClick={() => onDelete(image.id)}
        >
          <Trash2 size={14} />
        </button>

        <div 
          className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-600 p-1.5 rounded-full shadow-md border border-slate-200 pointer-events-auto cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDownRotate}
        >
          <RotateCw size={14} />
        </div>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-indigo-500" />

        <div 
          className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-indigo-500 rounded-full shadow-md pointer-events-auto cursor-nwse-resize"
          onPointerDown={handlePointerDownResize}
        />
      </div>
    </div>
  );
}
