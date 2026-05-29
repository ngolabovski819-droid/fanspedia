import CreatorGridSkeleton from '@/components/CreatorGridSkeleton';

export default function Loading() {
  return (
    <>
      <div className="breadcrumb" style={{ height: 20, opacity: 0 }} aria-hidden="true" />
      <section className="page-hero">
        <div style={{ height: 36, width: '60%', background: 'var(--surface-raised)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 16, width: '80%', background: 'var(--surface-raised)', borderRadius: 4 }} />
      </section>
      <CreatorGridSkeleton />
    </>
  );
}
