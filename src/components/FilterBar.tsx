'use client';

export type SortOption = 'popular' | 'new' | 'price_asc' | 'price_desc';

interface Props {
  sort: SortOption;
  freeOnly: boolean;
  verifiedOnly: boolean;
  onSort: (s: SortOption) => void;
  onFreeOnly: (v: boolean) => void;
  onVerifiedOnly: (v: boolean) => void;
  total?: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'new', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
];

export default function FilterBar({ sort, freeOnly, verifiedOnly, onSort, onFreeOnly, onVerifiedOnly, total }: Props) {
  return (
    <div className="filter-bar">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`filter-pill${sort === opt.value ? ' active' : ''}`}
          onClick={() => onSort(opt.value)}
        >
          {opt.label}
        </button>
      ))}
      <button
        className={`filter-pill${freeOnly ? ' active' : ''}`}
        onClick={() => onFreeOnly(!freeOnly)}
      >
        Free Only
      </button>
      <button
        className={`filter-pill${verifiedOnly ? ' active' : ''}`}
        onClick={() => onVerifiedOnly(!verifiedOnly)}
      >
        ✓ Verified
      </button>
      {total !== undefined && (
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
          {total.toLocaleString()} creators
        </span>
      )}
    </div>
  );
}
