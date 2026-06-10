'use client';

import { useRef, useState } from 'react';

const LIMIT = 160;

export default function CreatorBio({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const needsTruncation = text.length > LIMIT;
  if (!needsTruncation) {
    return <p className="cp-about">{text}</p>;
  }

  // Cut at the last word boundary before the limit so we don't slice mid-word.
  const cut = text.slice(0, LIMIT);
  const lastSpace = cut.lastIndexOf(' ');
  const preview = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();

  function toggle() {
    const btn = btnRef.current;
    // The toggle button moves when the bio expands/collapses, which makes the
    // page appear to jump under the cursor. Keep the button pinned to the same
    // on-screen position by compensating scroll after the DOM updates.
    const before = btn?.getBoundingClientRect().top ?? 0;
    setExpanded((v) => !v);
    if (btn) {
      requestAnimationFrame(() => {
        const after = btn.getBoundingClientRect().top;
        window.scrollBy(0, after - before);
      });
    }
  }

  return (
    <p className="cp-about">
      {expanded ? text : `${preview}… `}
      <button
        ref={btnRef}
        type="button"
        className="cp-bio-toggle"
        onClick={toggle}
        aria-expanded={expanded}
      >
        {expanded ? 'Show less' : 'Read full bio'}
      </button>
    </p>
  );
}
