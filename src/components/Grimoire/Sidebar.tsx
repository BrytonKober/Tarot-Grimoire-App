import React, { useState } from 'react';
import { Plus, Search, FileText, Trash2, X, Edit2 } from 'lucide-react';
import { cn, extractTextFromNode } from '../../lib/utils';
import { GrimoirePage } from '../../lib/db';

interface SidebarProps {
  pages: GrimoirePage[];
  activePageId: string | null;
  activePageContent?: any;
  onSelectPage: (id: string) => void;
  onCreatePage: () => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, newTitle: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  pages,
  activePageId,
  activePageContent,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  searchQuery,
  onSearchChange,
  isOpen,
  onClose,
}: SidebarProps) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  function extractHeadings(node: any) {
    const headings: { index: number; level: number; text: string }[] = [];
    let headingIndex = 0;

    function traverse(n: any) {
      if (!n) return;
      if (n.type === 'heading') {
        const text = extractTextFromNode(n);
        if (text.trim()) {
          headings.push({ index: headingIndex, level: n.attrs?.level || 1, text });
        }
        headingIndex++;
      } else if (n.content && Array.isArray(n.content)) {
        n.content.forEach(traverse);
      }
    }

    traverse(node);
    return headings;
  }

  const handleRenameSubmit = (id: string) => {
    if (editTitle.trim() !== '') {
      onRenamePage(id, editTitle);
    }
    setEditingPageId(null);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-[60] md:hidden backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 md:w-64 bg-slate-50 border-r border-slate-200 h-full flex flex-col shadow-sm transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="text-indigo-600">✧</span> Grimoire
          </h2>
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 space-y-3">
          <button
            onClick={onCreatePage}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus size={16} /> New Page
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">
              No pages found
            </div>
          ) : (
            pages.map(page => {
              const isActive = activePageId === page.id;
              const headings = isActive && activePageContent ? extractHeadings(activePageContent) : [];

              return (
                <div key={page.id} className="mb-1">
                  <div
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      isActive 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                    onClick={() => onSelectPage(page.id)}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <FileText size={14} className={isActive ? "text-indigo-500 shrink-0" : "text-slate-400 shrink-0"} />
                      {editingPageId === page.id ? (
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRenameSubmit(page.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(page.id);
                            if (e.key === 'Escape') setEditingPageId(null);
                          }}
                          className="w-full bg-white border border-indigo-300 rounded px-1 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm font-medium truncate">{page.title || 'Untitled'}</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPageId(page.id);
                          setEditTitle(page.title);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                        title="Rename Page"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(page.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        title="Delete Page"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Table of Contents */}
                  {isActive && headings.length > 0 && (
                    <div className="mt-1 mb-2 ml-4 pl-2 border-l-2 border-indigo-100 space-y-1">
                      {headings.map((h) => (
                        <div
                          key={`${h.index}-${h.text}`}
                          onClick={() => {
                            const editorEl = document.querySelector('.ProseMirror');
                            if (!editorEl) return;
                            const headingEls = Array.from(editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
                            const target = headingEls[h.index];
                            if (target) {
                              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              onClose();
                            }
                          }}
                          className={cn(
                            "text-xs cursor-pointer hover:text-indigo-600 truncate transition-colors text-slate-500 py-1",
                            h.level === 1 ? "font-semibold" : h.level === 2 ? "pl-2" : "pl-4"
                          )}
                          title={h.text}
                        >
                          {h.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
