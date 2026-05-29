import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact FansPedia | Get in Touch With Our Team',
  description: 'Contact the FansPedia team. Have a question, feedback, or need help with a creator listing? Reach us at fanspediaofficial@gmail.com - we respond within 24 hours.',
  alternates: { canonical: 'https://fanspedia.net/contact/' },
};

export default function ContactPage() {
  return <ContactClient />;
}
