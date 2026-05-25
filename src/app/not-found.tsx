import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="page-hero" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: 72, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>404</h1>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>
        Back to Home
      </Link>
    </section>
  );
}
