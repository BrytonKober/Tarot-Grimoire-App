import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  useSensor,
  useSensors,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  DragStartEvent,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Menu, BookOpen, LayoutGrid, Save, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

import { Placeholder, Spread, TarotCard } from './types';
import { TAROT_DECK } from './lib/deck';
import { createSecureRandom } from './lib/random';
import { Sidebar } from './components/Sidebar';
import { GridCanvas } from './components/GridCanvas';
import { cn } from './lib/utils';
import { GrimoireApp } from './components/Grimoire/GrimoireApp';
import { dbPromise } from './lib/db';

const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;

export default function App() {
  const [cards, setCards] = useState<Placeholder[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'tarot' | 'grimoire'>('tarot');
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem('tarot-tutorial-seen') !== 'true';
  });
  const [zoom, setZoom] = useState(1);
  const currentCellSize = 80 * zoom;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dragDelta, setDragDelta] = useState<{x: number, y: number} | null>(null);

  const [pastReadings, setPastReadings] = useState<TarotSnapshot[]>([]);

  useEffect(() => {
    async function loadReadings() {
      const db = await dbPromise;
      const all = await db.getAllFromIndex('snapshots', 'by-created');
      setPastReadings(all.reverse());
      
      // If no past readings and tutorial hasn't been seen, add a default card
      if (all.length === 0 && showTutorial && cards.length === 0) {
        const startX = Math.floor(GRID_WIDTH / 2) - 1;
        const startY = Math.floor(GRID_HEIGHT / 2) - 1.5;
        setCards([{
          id: uuidv4(),
          x: startX,
          y: startY,
          width: 2,
          height: 3,
          rotationMode: 'vertical',
          zIndex: 0,
          flipped: false,
        }]);
      }
    }
    loadReadings();
  }, []);

  // Scroll to center on initial load
  useEffect(() => {
    if (currentView === 'tarot') {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const main = document.getElementById('main-scroll-area');
        if (main) {
          main.scrollTop = (main.scrollHeight - main.clientHeight) / 2;
          main.scrollLeft = (main.scrollWidth - main.clientWidth) / 2;
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [currentView, showTutorial]);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('tarot-tutorial-seen', 'true');
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleAddCard = () => {
    let startX = Math.floor(GRID_WIDTH / 2) - 1;
    let startY = Math.floor(GRID_HEIGHT / 2) - 1.5;

    const canvas = document.getElementById('grid-canvas');
    const main = document.getElementById('main-scroll-area');

    if (canvas && main) {
      const canvasRect = canvas.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();

      // Calculate the center of the visible area relative to the canvas
      const visibleCenterX = (mainRect.left + mainRect.width / 2) - canvasRect.left;
      const visibleCenterY = (mainRect.top + mainRect.height / 2) - canvasRect.top;

      startX = visibleCenterX / currentCellSize - 1;
      startY = visibleCenterY / currentCellSize - 1.5;

      // Keep within bounds
      startX = Math.max(0, Math.min(startX, GRID_WIDTH - 2));
      startY = Math.max(0, Math.min(startY, GRID_HEIGHT - 3));
    }

    // Add slight offset for multiple cards added in the same spot
    const offset = (cards.length % 5) * 0.5;

    const newCard: Placeholder = {
      id: uuidv4(),
      x: startX + offset,
      y: startY + offset,
      width: 2,
      height: 3,
      rotationMode: 'vertical',
      zIndex: cards.length,
      flipped: false,
    };
    setCards((prev) => [...prev, newCard]);
  };

  const handleUpdateCard = (id: string, updates: Partial<Placeholder>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDeleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    if (!selectedIds.has(id)) {
      setSelectedIds(new Set([id]));
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    setDragDelta({ x: event.delta.x, y: event.delta.y });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setDragDelta(null);
    const { delta } = event;

    setCards((prev) =>
      prev.map((c) => {
        if (selectedIds.has(c.id)) {
          let newX = c.x + delta.x / currentCellSize;
          let newY = c.y + delta.y / currentCellSize;
          newX = Math.max(0, Math.min(newX, GRID_WIDTH - (c.rotationMode === 'horizontal' ? c.height : c.width)));
          newY = Math.max(0, Math.min(newY, GRID_HEIGHT - (c.rotationMode === 'horizontal' ? c.width : c.height)));
          return { ...c, x: newX, y: newY };
        }
        return c;
      })
    );
  };

  const handleCardClick = (id: string, ctrlKey: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (ctrlKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSetSelection = (ids: Set<string>) => {
    setSelectedIds(ids);
  };

  const handleFlipCards = async () => {
    if (cards.length === 0) return;
    
    setIsFlipping(true);

    try {
      const secureRandom = await createSecureRandom(question);
      let availableDeck = [...TAROT_DECK];
      
      // We don't allow duplicates. If we need more cards than the deck has, we must allow duplicates
      const needsDuplicates = cards.length > availableDeck.length;
      const useDuplicates = needsDuplicates;

      if (!useDuplicates) {
        availableDeck = secureRandom.shuffle(availableDeck);
      }

      const newCards = cards.map((card, index) => {
        if (card.assignedCard) return { ...card, flipped: true };
        
        let assignedCard: TarotCard;
        
        if (useDuplicates) {
          const randomIndex = secureRandom.nextInt(0, TAROT_DECK.length);
          assignedCard = TAROT_DECK[randomIndex];
        } else {
          assignedCard = availableDeck[index];
        }

        const orientation = card.rotationMode === 'horizontal' 
          ? 'sideways' 
          : (secureRandom.nextBoolean() ? 'upright' : 'reversed');

        return {
          ...card,
          assignedCard,
          orientation,
          flipped: true,
        };
      });

      setCards(newCards);
      setIsFlipped(true);

      // Auto-save reading
      const title = question || 'Tarot Reading';
      const spread: Spread = {
        grid: { cellSize: 80, width: GRID_WIDTH, height: GRID_HEIGHT },
        cards: newCards,
      };
      const snapshot: TarotSnapshot = {
        id: uuidv4(),
        title,
        spread,
        createdAt: Date.now(),
      };
      const db = await dbPromise;
      await db.put('snapshots', snapshot);
      setPastReadings(prev => [snapshot, ...prev]);

    } finally {
      setIsFlipping(false);
    }
  };

  const handleResetFlips = () => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        assignedCard: null,
        orientation: undefined,
        flipped: false,
      }))
    );
    setIsFlipped(false);
  };

  const handleClearAll = () => {
    setCards([]);
    setIsFlipped(false);
    setSelectedIds(new Set());
  };

  const handleLoadReading = (snapshot: TarotSnapshot) => {
    setCards(snapshot.spread.cards);
    setIsFlipped(true);
    setQuestion(snapshot.title === 'Tarot Reading' ? '' : snapshot.title);
    setSelectedIds(new Set());
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleExport = () => {
    const spread: Spread = {
      grid: { cellSize: 80, width: GRID_WIDTH, height: GRID_HEIGHT },
      cards,
    };
    const blob = new Blob([JSON.stringify(spread, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tarot-spread.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const spread: Spread = JSON.parse(event.target?.result as string);
        setCards(spread.cards || []);
        setIsFlipped(spread.cards?.some(c => c.flipped) || false);
        setSelectedIds(new Set());
      } catch (err) {
        console.error('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden font-sans">
      {showTutorial && currentView === 'tarot' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-indigo-600">✧</span> Welcome to Tarot Builder
            </h2>
            <div className="space-y-4 text-slate-600 mb-8">
              <p>
                Create your own custom tarot spreads and perform readings.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Add Cards:</strong> Open the menu to add new cards to the canvas.</li>
                <li><strong>Arrange:</strong> Drag and drop cards to create your spread.</li>
                <li><strong>Read:</strong> Enter a question and click "Flip Cards" to reveal your reading.</li>
                <li><strong>Save:</strong> Your readings are automatically saved to your Grimoire.</li>
              </ul>
            </div>
            <button
              onClick={closeTutorial}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setCurrentView('tarot')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                currentView === 'tarot' 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Tarot Builder</span>
            </button>
            <button
              onClick={() => setCurrentView('grimoire')}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                currentView === 'grimoire' 
                  ? "bg-white text-indigo-700 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <BookOpen size={16} />
              <span className="hidden sm:inline">Grimoire</span>
            </button>
          </div>
        </div>
      </div>

      {currentView === 'grimoire' ? (
        <GrimoireApp />
      ) : (
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20 shadow-sm shrink-0">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600">✧</span> Tarot Builder
            </h1>
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm transition-opacity" 
              onClick={() => setIsSidebarOpen(false)} 
            />
          )}

          {/* Sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <Sidebar
              cards={cards}
              onAddCard={handleAddCard}
              onFlipCards={handleFlipCards}
              onResetFlips={handleResetFlips}
              onClearAll={handleClearAll}
              onExport={handleExport}
              onImport={handleImport}
              isFlipped={isFlipped}
              question={question}
              onChangeQuestion={setQuestion}
              isFlipping={isFlipping}
              onClose={() => setIsSidebarOpen(false)}
              pastReadings={pastReadings}
              onLoadReading={handleLoadReading}
            />
          </div>

          <div className="relative flex-1 flex flex-col overflow-hidden">
            <main id="main-scroll-area" className="flex-1 overflow-auto relative z-0">
              <div className="min-w-full min-h-full w-max h-max p-4 md:p-8 flex">
                <div className="m-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToWindowEdges]}
                  >
                    <GridCanvas
                      cards={cards}
                      cellSize={currentCellSize}
                      width={GRID_WIDTH}
                      height={GRID_HEIGHT}
                      onUpdateCard={handleUpdateCard}
                      onDeleteCard={handleDeleteCard}
                      selectedIds={selectedIds}
                      activeId={activeId}
                      dragDelta={dragDelta}
                      onCardClick={handleCardClick}
                      onClearSelection={handleClearSelection}
                      onSetSelection={handleSetSelection}
                    />
                  </DndContext>
                </div>
              </div>
            </main>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
              <button 
                onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
                className="p-3 bg-white text-slate-700 hover:bg-slate-50 rounded-full shadow-lg border border-slate-200 transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <button 
                onClick={() => setZoom(1)}
                className="p-3 bg-white text-slate-700 hover:bg-slate-50 rounded-full shadow-lg border border-slate-200 transition-colors"
                title="Reset Zoom"
              >
                <Maximize size={20} />
              </button>
              <button 
                onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))}
                className="p-3 bg-white text-slate-700 hover:bg-slate-50 rounded-full shadow-lg border border-slate-200 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
