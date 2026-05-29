import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AgeGate from '@/components/AgeGate';
import './globals.css';

const SITE_URL = 'https://fanspedia.net';
const GA_ID = 'G-3XB30HS12L';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'FansPedia — Find OnlyFans Creators',
    template: '%s | FansPedia',
  },
  description: 'Discover the best OnlyFans creators from around the world. Search by category, location, and more.',
  openGraph: {
    type: 'website',
    siteName: 'FansPedia',
    url: SITE_URL,
  },
  robots: { index: true, follow: true },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FansPedia',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FansPedia',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  legalName: 'INCREVATE LLC',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '75 E 3RD ST, STE 7',
    addressLocality: 'Sheridan',
    addressRegion: 'WY',
    postalCode: '82801',
    addressCountry: 'US',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body>
        <AgeGate />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
      <GoogleAnalytics gaId={GA_ID} />
    </html>
  );
}
