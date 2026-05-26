import Link from 'next/link';
import { categories } from '@/config/categories';
import { COUNTRIES_LIST } from '@/config/countries';

export default function Footer() {
  const year = new Date().getFullYear();

  const popularCats = categories.filter((c) => c.popular).slice(0, 10);
  const featuredCountries = COUNTRIES_LIST.slice(0, 12);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">FansPedia</div>
          <p className="footer-tagline">
            Discover the best OnlyFans creators from around the world.
            Search by category, location, and more.
          </p>
          <p style={{ fontSize: 12 }}>
            FansPedia is an independent directory. We are not affiliated with OnlyFans.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/categories/">Categories</Link></li>
            <li><Link href="/locations/">Locations</Link></li>
            <li><Link href="/near-me/">Near Me</Link></li>
            <li><Link href="/search/">Search</Link></li>
            <li><Link href="/wishlist/">My Wishlist</Link></li>
            <li><Link href="/blog/">Blog</Link></li>
            <li><Link href="/promote/">Promote Your Page</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Top Categories</h4>
          <ul>
            {popularCats.map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}/`}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>Countries</h4>
          <ul>
            {featuredCountries.map((c) => (
              <li key={c.slug}>
                <Link href={`/country/${c.slug}/`}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} FansPedia. All rights reserved.</span>
        <nav style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/about/">About</Link>
          <Link href="/contact/">Contact</Link>
          <Link href="/privacy/">Privacy Policy</Link>
          <Link href="/terms/">Terms of Service</Link>
          <Link href="/dmca/">DMCA</Link>
        </nav>
      </div>
    </footer>
  );
}
