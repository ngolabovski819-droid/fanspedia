'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items: FAQItem[];
  title?: string;
}

export default function FAQ({ items, title = 'Frequently Asked Questions' }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="faq-section" aria-label="FAQ">
      <h2 style={{ color: 'var(--accent)', fontSize: 22, marginBottom: 20 }}>{title}</h2>
      {items.map((item, i) => (
        <div key={i} className={`faq-item${open === i ? ' open' : ''}`}>
          <button
            className="faq-question"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            {item.question}
            <span className="faq-icon">+</span>
          </button>
          <div className="faq-answer" role="region">
            {item.answer}
          </div>
        </div>
      ))}
    </section>
  );
}
