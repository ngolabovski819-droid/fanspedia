// Placeholder grid shown while the Supabase fetch resolves.
// Matches the exact card dimensions so there is zero layout shift on hydration.
export default function CreatorGridSkeleton() {
  return (
    <div className="creator-grid" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="creator-card card-skeleton">
          <div className="card-img-wrap" />
          <div className="card-body">
            <div style={{ height: 15, background: 'var(--surface-raised)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, background: 'var(--surface-raised)', borderRadius: 4, width: '55%', marginBottom: 8 }} />
            <div style={{ height: 13, background: 'var(--surface-raised)', borderRadius: 4, width: '35%', marginTop: 'auto' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
