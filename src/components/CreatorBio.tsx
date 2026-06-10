'use client';

import { useState } from 'react';

const LIMIT = 160;

export default function CreatorBio({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  const needsTruncation = text.length > LIMIT;
  if (!needsTruncation) {
    return <p className="cp-about">{text}</p>;
  }

  // Cut at the last word boundary before the limit so we don't slice mid-word.
  const cut = text.slice(0, LIMIT);
  const lastSpace = cut.lastIndexOf(' ');
  const preview = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();

  return (
    <p className="cp-about">
      {expanded ? text : `${preview}… `}
      <button
        type="button"
        className="cp-bio-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? 'Show less' : 'Read full bio'}
      </button>
    </p>
  );
}
