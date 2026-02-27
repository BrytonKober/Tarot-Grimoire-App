import React, { useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GrimoirePage, FloatingImage } from '../../lib/db';
import { getPages, putPage, deletePage } from '../../lib/data';
import { useAuth } from '../../contexts/AuthContext';
import { Editor } from './Editor';
import { Sidebar } from './Sidebar';
import { FloatingImageComponent } from './FloatingImageComponent';
import { ImageIcon, Eye, Edit3 } from 'lucide-react';
import { cn, extractTextFromNode } from '../../lib/utils';

export function GrimoireApp() {
  const [pages, setPages] = useState<GrimoirePage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const { loading, user } = useAuth();

  // Load pages on mount
  useEffect(() => {
    async function loadPages() {
      if (loading) return;
      const sorted = await getPages();
      setPages(sorted);
      if (sorted.length > 0 && !activePageId) {
        setActivePageId(sorted[0].id);
      } else if (sorted.length === 0) {
        handleCreatePage();
      }
    }
    loadPages();
  }, [loading, user]);

  const handleCreatePage = async () => {
    const newPage: GrimoirePage = {
      id: uuidv4(),
      title: 'Untitled Page',
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await putPage(newPage);
    setPages(prev => [newPage, ...prev]);
    setActivePageId(newPage.id);
    setIsSidebarOpen(false);
  };

  const handleDeletePage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    await deletePage(id);
    setPages(prev => prev.filter(p => p.id !== id));
    if (activePageId === id) {
      const remaining = pages.filter(p => p.id !== id);
      if (remaining.length > 0) {
        setActivePageId(remaining[0].id);
      } else {
        handleCreatePage();
      }
    }
  };

  const handleUpdatePage = useCallback(async (id: string, updates: Partial<GrimoirePage>) => {
    setPages(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates, updatedAt: Date.now() };
        // Autosave to DB
        putPage(updated);
        return updated;
      }
      return p;
    }));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePageId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const src = event.target?.result as string;
      
      const img = new Image();
      img.onload = async () => {
        const maxWidth = 300;
        const scale = Math.min(1, maxWidth / img.width);
        const width = img.width * scale;
        const height = img.height * scale;

        const scrollArea = document.getElementById('grimoire-scroll-area');
        const scrollTop = scrollArea ? scrollArea.scrollTop : 0;
        
        const newImage: FloatingImage = {
          id: uuidv4(),
          src,
          x: 100,
          y: scrollTop + 100,
          width,
          height,
          rotation: 0,
          zIndex: Date.now(),
        };

        setPages(prev => prev.map(p => {
          if (p.id === activePageId) {
            const updated = {
              ...p,
              images: [...(p.images || []), newImage],
              updatedAt: Date.now()
            };
            putPage(updated);
            return updated;
          }
          return p;
        }));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUpdateImage = useCallback((imageId: string, updates: Partial<FloatingImage>) => {
    if (!activePageId) return;
    setPages(prev => prev.map(p => {
      if (p.id === activePageId) {
        const updatedImages = (p.images || []).map(img => 
          img.id === imageId ? { ...img, ...updates } : img
        );
        const updated = { ...p, images: updatedImages, updatedAt: Date.now() };
        putPage(updated);
        return updated;
      }
      return p;
    }));
  }, [activePageId]);

  const handleDeleteImage = useCallback((imageId: string) => {
    if (!activePageId) return;
    setPages(prev => prev.map(p => {
      if (p.id === activePageId) {
        const updatedImages = (p.images || []).filter(img => img.id !== imageId);
        const updated = { ...p, images: updatedImages, updatedAt: Date.now() };
        putPage(updated);
        return updated;
      }
      return p;
    }));
  }, [activePageId]);

  const activePage = pages.find(p => p.id === activePageId);

  const filteredPages = pages.filter(p => {
    const q = searchQuery.toLowerCase();
    if (p.title.toLowerCase().includes(q)) return true;
    const textContent = extractTextFromNode(p.content).toLowerCase();
    return textContent.includes(q);
  });

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      <Sidebar
        pages={filteredPages}
        activePageId={activePageId}
        activePageContent={activePage?.content}
        onSelectPage={(id) => {
          setActivePageId(id);
          setIsSidebarOpen(false);
        }}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onRenamePage={(id, title) => handleUpdatePage(id, { title })}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-20">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className="ml-2 font-medium text-slate-800 truncate flex-1">
            {activePage?.title || 'Grimoire'}
          </div>
        </div>

        {activePage ? (
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative" id="grimoire-scroll-area">
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 relative min-h-full">
              {/* Floating Images */}
              {[...(activePage.images || [])]
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map((img, index) => (
                <FloatingImageComponent 
                  key={img.id}
                  image={img} 
                  displayZIndex={index + 20}
                  onUpdate={handleUpdateImage} 
                  onDelete={handleDeleteImage} 
                  viewMode={viewMode}
                />
              ))}

              {/* Add Image Button & View Mode Toggle */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <button
                  onClick={() => setViewMode(!viewMode)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 border rounded-lg shadow-sm text-sm font-medium transition-colors cursor-pointer",
                    viewMode 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {viewMode ? <Edit3 size={16} /> : <Eye size={16} />}
                  <span className="hidden sm:inline">{viewMode ? 'Edit Mode' : 'View Mode'}</span>
                </button>
              </div>

              <input
                type="text"
                value={activePage.title}
                onChange={(e) => handleUpdatePage(activePage.id, { title: e.target.value })}
                placeholder="Page Title"
                className="w-full text-4xl sm:text-5xl font-bold text-slate-900 placeholder:text-slate-300 border-none outline-none bg-transparent mb-8 relative z-0"
                disabled={viewMode}
              />
              <div className="relative z-0">
                <Editor
                  key={activePage.id} // Force re-mount on page change
                  content={activePage.content}
                  onChange={(content) => handleUpdatePage(activePage.id, { content })}
                  viewMode={viewMode}
                  onImageUpload={handleImageUpload}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Select or create a page to start writing
          </div>
        )}
      </main>
    </div>
  );
}
