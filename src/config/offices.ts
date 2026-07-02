export type OfficeKey = 'gainesville' | 'ocala';

export interface Office {
  key: OfficeKey;
  label: string;              // "Gainesville"
  schemaName: string;         // "Be Secure Locksmith — Gainesville"
  slug: string;               // service-area page slug used as the location page
  street: string;             // "901 NW 8th Ave. C17"
  cityStateZip: string;       // "Gainesville, FL 32601"
  city: string; state: string; zip: string;
  streetSchema: string;       // exact live casing, e.g. "901 NW 8th Ave c17"
  phone: string;              // main display line
  trackingPhone: string;      // "1-352-290-7035" (schema/CTA on the location page)
  email: string;
  geo: { lat: number; lng: number };
  cid: string;
  kgmid: string;              // "/g/1ptx2pkfg"
  ratingValue: string;        // "4.9"
  reviewCount: string;        // "1330"
  sameAs: string[];           // that office's GBP + directory profiles
}

export const offices: Record<OfficeKey, Office> = {
  gainesville: {
    key: 'gainesville', label: 'Gainesville',
    schemaName: 'Be Secure Locksmith — Gainesville',
    slug: 'locksmith-gainesville-fl',
    street: '901 NW 8th Ave. C17', cityStateZip: 'Gainesville, FL 32601',
    city: 'Gainesville', state: 'FL', zip: '32601',
    streetSchema: '901 NW 8th Ave c17',
    phone: '352-706-5295', trackingPhone: '1-352-290-7035',
    email: 'info@besecurelocksmith.com',
    geo: { lat: 29.65886, lng: -82.3345 },
    cid: '1525264823828817691', kgmid: '/g/1ptx2pkfg',
    ratingValue: '4.9', reviewCount: '1330',
    sameAs: [
      'https://www.google.com/search?kgmid=/g/1ptx2pkfg',
      'https://www.yelp.com/biz/be-secure-locksmith-gainesville-2',
      'https://www.facebook.com/BeSecureLocksmith',
      'https://linkedin.com/company/be-secure-locksmith',
      'https://www.bbb.org/us/fl/gainesville/profile/locksmith/be-secure-locksmith-llc-0403-235965422/',
      'https://1800unlocks.com/locksmith/florida/gainesville/be-secure-locksmith-gainesville/',
      'https://fairtradelocksmiths.com/locksmith/local/be-secure-locksmith-gainesville',
      'https://members.gainesvillechamber.com/list/member/be-secure-locksmith-gainesville-30726',
    ],
  },
  ocala: {
    key: 'ocala', label: 'Ocala',
    schemaName: 'Be Secure Locksmith — Ocala',
    slug: 'locksmith-ocala-fl',
    street: '217 SE 1st Ave. Suite 200-50', cityStateZip: 'Ocala, FL 34471',
    city: 'Ocala', state: 'FL', zip: '34471',
    streetSchema: '217 SE 1st Ave Suite 200-50',
    phone: '352-325-7953', trackingPhone: '1-352-325-7953',
    email: 'info@besecurelocksmith.com',
    geo: { lat: 29.1844122, lng: -82.1355775 },
    cid: '4138983982412980004', kgmid: '/g/1yfprvxjj',
    ratingValue: '4.9', reviewCount: '1214',
    sameAs: [
      'https://www.google.com/search?kgmid=/g/1yfprvxjj',
      'https://www.yelp.com/biz/be-secure-locksmith-ocala',
      'https://www.facebook.com/BeSecureLocksmith',
      'https://linkedin.com/company/be-secure-locksmith',
      'https://1800unlocks.com/locksmith/florida/ocala/be-secure-locksmith-ocala/',
      'https://fairtradelocksmiths.com/locksmith/local/be-secure-locksmith-ocala',
    ],
  },
} as const;
