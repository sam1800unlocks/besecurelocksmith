export type OfficeKey = 'gainesville' | 'ocala';

export const offices = {
  gainesville: {
    key: 'gainesville', label: 'Gainesville',
    street: '901 NW 8th Ave. C17', cityStateZip: 'Gainesville, FL 32601',
    phone: '352-706-5295',
    mapQuery: '901 NW 8th Ave C17 Gainesville FL 32601',
    gbp: 'https://www.google.com/search?kgmid=/g/1ptx2pkfg',
  },
  ocala: {
    key: 'ocala', label: 'Ocala',
    street: '217 SE 1st Ave. Suite 200-50', cityStateZip: 'Ocala, FL 34471',
    phone: '352-325-7953',
    mapQuery: '217 SE 1st Ave Suite 200 Ocala FL 34471',
    gbp: 'https://www.google.com/search?kgmid=/g/1yfprvxjj',
  },
} as const;
