// Normalize a US phone number to E.164 with country code, e.g. "352-706-5295" -> "+13527065295".
export const e164 = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  const withCc = digits.length === 10 ? '1' + digits : digits.replace(/^\+/, '');
  return '+' + withCc;
};
export const telHref = (phone: string) => 'tel:' + e164(phone);
export const smsHref = (phone: string) => 'sms:' + e164(phone);

export const site = {
  name: 'Be Secure Locksmith',
  tagline: 'If it has a key, we can unlock it!',
  logo: '/img/besecure-logo-100h.png',
  license: 'HCLO18005',
  insurance: 'BKS56465112',
  address: { street: '901 NW 8th Ave. C17', city: 'Gainesville', state: 'FL', zip: '32601' },
  hours: 'Mon–Fri 8am–5pm · Sat–Sun Closed',
  ratingValue: '4.9',
  ratingCount: '2551',
  sinceYear: '2012',
  agencyCredit: 'Powered by The Locksmith Agency',
  defaultPhone: '352-706-5295',
  smsPhone: '352-389-5305',
  bookingUrl: 'https://online-booking.workiz.com/?ac=744610670459142e62f3f47913956e45311c10147d3f5224d2489d7eab57c2a7',
  footerServices: ['Residential','Commercial','Automotive','Key Duplication','Car Key Replacement','Ignition Repair','Lock Rekeying','Smart Locks','Master Key Systems'],
  payments: ['Cash','Credit Cards','Mobile Pay'],
  socials: [
    { name: 'Facebook', icon: '/img/social/FB-512.svg', href: 'https://www.facebook.com/BeSecureLocksmith/' },
    { name: 'YouTube', icon: '/img/social/YouTube-icon.svg', href: 'https://www.youtube.com/channel/UCwpODmKG5TrCVIJTzEB6FXA' },
    { name: 'Instagram', icon: '/img/social/IG-round-2.svg', href: 'https://www.instagram.com/locksmithbesecure/' },
    { name: 'Yelp', icon: '/img/social/yelp-svgrepo-com.svg', href: 'https://www.yelp.com/biz/be-secure-locksmith-gainesville-2' },
    { name: 'LinkedIn', icon: '/img/social/linkedin.svg', href: 'https://www.linkedin.com/company/be-secure-locksmith' },
  ],
} as const;

// Service-area pages that have a dedicated landing page (the "top" areas),
// mirroring the live site's linked cities. Single source for the footer +
// any service-area listings. The full list lives at /service-areas/.
export const serviceAreas = [
  { name: 'Alachua',      href: '/service-areas/locksmith-alachua-fl/' },
  { name: 'Belleview',    href: '/service-areas/locksmith-belleview-fl/' },
  { name: 'Gainesville',  href: '/service-areas/locksmith-gainesville-fl/' },
  { name: 'Hampton',      href: '/service-areas/locksmith-hampton-fl/' },
  { name: 'High Springs', href: '/service-areas/locksmith-high-springs-fl/' },
  { name: 'Lake City',    href: '/service-areas/locksmith-lake-city-fl/' },
  { name: 'Newberry',     href: '/service-areas/locksmith-newberry-fl/' },
  { name: 'Ocala',        href: '/service-areas/locksmith-ocala-fl/' },
  { name: 'Silver Springs', href: '/service-areas/locksmith-silver-springs-fl/' },
  { name: 'The Villages', href: '/service-areas/locksmith-the-villages-fl/' },
  { name: 'Williston',    href: '/service-areas/locksmith-williston-fl/' },
] as const;

export const nav = [
  { label: 'Home',          href: '/',              active: true },
  { label: 'About',         href: '/about/' },
  { label: 'Services ▾',   href: '/services/' },
  { label: 'Price List',    href: '/price-list/' },
  { label: 'Service Areas', href: '/service-areas/' },
  { label: 'Testimonials',  href: '/testimonials/' },
  { label: 'Blog',          href: '/blog/' },
  { label: 'Contact',       href: '/contact-us/' },
] as const;
