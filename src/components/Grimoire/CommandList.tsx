import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '../../lib/utils';

export const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden py-1.5 min-w-[220px]">
      {props.items.map((item: any, index: number) => (
        <button
          className={cn(
            "w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors",
            index === selectedIndex ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
          )}
          key={index}
          onClick={() => selectItem(index)}
        >
          <span className={cn(
            "flex items-center justify-center w-6 h-6 rounded-md",
            index === selectedIndex ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
          )}>{item.icon}</span>
          <span className="font-medium">{item.title}</span>
        </button>
      ))}
    </div>
  );
});
