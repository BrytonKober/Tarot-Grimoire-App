import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { CommandList } from './CommandList';
import { Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, ImageIcon, Sticker } from 'lucide-react';

export const getSuggestionItems = ({ query, triggerStickerUpload, triggerInlineImageUpload }: { query: string, triggerStickerUpload?: () => void, triggerInlineImageUpload?: () => void }) => {
  return [
    {
      title: 'Heading 1',
      icon: <Heading1 size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      icon: <Heading2 size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      icon: <Heading3 size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      icon: <List size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      icon: <ListOrdered size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Quote',
      icon: <Quote size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: 'Divider',
      icon: <Minus size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: 'In-Page Image',
      icon: <ImageIcon size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        if (triggerInlineImageUpload) triggerInlineImageUpload();
      },
    },
    {
      title: 'Sticker Image',
      icon: <Sticker size={18} />,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        if (triggerStickerUpload) triggerStickerUpload();
      },
    },
  ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
};

export const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        theme: 'slash-command',
      });
    },

    onUpdate(props: any) {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup?.[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === 'Escape') {
        popup?.[0].hide();
        return true;
      }
      return component?.ref?.onKeyDown(props);
    },

    onExit() {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
