'use client';

import { useEffect, useRef, useState } from 'react';

/** Tracks an element's width so charts draw at real pixel size (crisp text at any width).
 * Starts from `initial` so the server render and print have a sensible layout. */
export const useWidth = <T extends HTMLElement>(initial: number) => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) {
        setWidth(next);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
};
