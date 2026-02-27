import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { ResizableImage } from './ResizableImageExtension';
import { Bold, Italic, List, ListOrdered, Quote, Minus, ImageIcon, Sticker } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SlashCommand, getSuggestionItems, renderItems } from './SlashCommand';

interface EditorProps {
  content: any;
  onChange: (content: any) => void;
  viewMode?: boolean;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Editor({ content, onChange, viewMode, onImageUpload }: EditorProps) {
  const stickerInputRef = React.useRef<HTMLInputElement>(null);
  const inlineImageInputRef = React.useRef<HTMLInputElement>(null);

  const handleInlineImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      editor?.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (inlineImageInputRef.current) {
      inlineImageInputRef.current.value = '';
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage,
      Placeholder.configure({
        placeholder: 'Write something, or type / to see commands...',
      }),
      SlashCommand.configure({
        suggestion: {
          items: ({ query }) => getSuggestionItems({ 
            query, 
            triggerStickerUpload: () => stickerInputRef.current?.click(),
            triggerInlineImageUpload: () => inlineImageInputRef.current?.click()
          }),
          render: renderItems,
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px]',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!viewMode);
    }
  }, [editor, viewMode]);

  useEffect(() => {
    if (editor && content !== editor.getJSON()) {
      // Only update if content is different to avoid cursor jumps
      // editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Toolbar */}
      {!viewMode && (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 p-2 mb-8 overflow-x-auto no-scrollbar rounded-b-xl shadow-sm">
          <div className="flex items-center gap-1 min-w-max px-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors", editor.isActive('bold') && "bg-slate-200")}
              title="Bold"
            >
              <Bold size={18} className="text-slate-700" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors", editor.isActive('italic') && "bg-slate-200")}
              title="Italic"
            >
              <Italic size={18} className="text-slate-700" />
            </button>
            <div className="shrink-0 w-px h-6 bg-slate-300 mx-2" />
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn("shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors font-bold text-slate-700", editor.isActive('heading', { level: 1 }) && "bg-slate-200")}
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn("shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors font-bold text-slate-700", editor.isActive('heading', { level: 2 }) && "bg-slate-200")}
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={cn("shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors font-bold text-slate-700", editor.isActive('heading', { level: 3 }) && "bg-slate-200")}
              title="Heading 3"
            >
              H3
            </button>
            <div className="shrink-0 w-px h-6 bg-slate-300 mx-2" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn("shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors", editor.isActive('bulletList') && "bg-slate-200")}
              title="Bullet List"
            >
              <List size={18} className="text-slate-700" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn("shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors", editor.isActive('orderedList') && "bg-slate-200")}
              title="Numbered List"
            >
              <ListOrdered size={18} className="text-slate-700" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn("shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors", editor.isActive('blockquote') && "bg-slate-200")}
              title="Quote"
            >
              <Quote size={18} className="text-slate-700" />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors"
              title="Divider"
            >
              <Minus size={18} className="text-slate-700" />
            </button>
            <div className="shrink-0 w-px h-6 bg-slate-300 mx-2" />
            <button
              onClick={() => inlineImageInputRef.current?.click()}
              className="shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors text-indigo-600 flex items-center gap-1"
              title="Add In-Page Image"
            >
              <ImageIcon size={18} />
            </button>
            <button
              onClick={() => stickerInputRef.current?.click()}
              className="shrink-0 p-2 rounded-md hover:bg-slate-100 transition-colors text-indigo-600 flex items-center gap-1"
              title="Add Sticker Image"
            >
              <Sticker size={18} />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={inlineImageInputRef}
              onChange={handleInlineImageUpload} 
            />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={stickerInputRef}
              onChange={onImageUpload} 
            />
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
