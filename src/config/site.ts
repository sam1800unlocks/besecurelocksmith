export const telHref = (phone: string) => 'tel:' + phone.replace(/\D/g, '');
export const smsHref = (phone: string) => 'sms:' + phone.replace(/\D/g, '');

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
  footerServices: ['Residential','Commercial','Automotive','Key Duplication','Car Key Replacement','Ignition Repair','Lock Rekeying','Smart Locks','Master Key Systems'],
  payments: ['Cash','Credit Cards','Mobile Pay'],
  socials: [
    { name: 'Google', icon: '/img/social/google-g-icon.svg', href: '#' },
    { name: 'Facebook', icon: '/img/social/FB-512.svg', href: '#' },
    { name: 'YouTube', icon: '/img/social/YouTube-icon.svg', href: '#' },
    { name: 'Instagram', icon: '/img/social/IG-round-2.svg', href: '#' },
    { name: 'Yelp', icon: '/img/social/yelp-svgrepo-com.svg', href: '#' },
    { name: 'LinkedIn', icon: '/img/social/linkedin.svg', href: '#' },
  ],
} as const;
