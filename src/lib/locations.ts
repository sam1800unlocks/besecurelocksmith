import { site } from '../config/site';

type Social = (typeof site.socials)[number];

export type Location = {
  slug: string; phone: string; city: string;
  nap: { street: string; city: string; state: string; zip: string };
  hours: string;
  socials?: readonly Social[];
};

// Ocala uses its own Yelp listing; everything else uses the global Yelp.
const ocalaSocials = site.socials.map((s) =>
  s.name === 'Yelp' ? { ...s, href: 'https://www.yelp.com/biz/be-secure-locksmith-ocala' } : s,
);

const LOCATIONS: Record<string, Location> = {
  main: {
    slug: 'main',
    phone: site.defaultPhone,
    city: 'Gainesville & Ocala',
    nap: { ...site.address },
    hours: site.hours,
  },
  // Tracking-number cities — custom phone + socials pulled from the live site.
  gainesville: {
    slug: 'gainesville',
    phone: '352-290-7035',
    city: 'Gainesville',
    nap: { street: '901 NW 8th Ave. C17', city: 'Gainesville', state: 'FL', zip: '32601' },
    hours: site.hours,
  },
  ocala: {
    slug: 'ocala',
    phone: '352-325-7953',
    city: 'Ocala',
    nap: { street: '217 SE 1st Ave. Suite 200-50', city: 'Ocala', state: 'FL', zip: '34471' },
    hours: site.hours,
    socials: ocalaSocials,
  },
  'lake-city': {
    slug: 'lake-city',
    phone: '386-251-6901',
    city: 'Lake City',
    // No Lake City office — served from the Gainesville office.
    nap: { street: '901 NW 8th Ave. C17', city: 'Gainesville', state: 'FL', zip: '32601' },
    hours: site.hours,
  },
};

export function resolveLocation(slug?: string): Location {
  return (slug && LOCATIONS[slug]) || LOCATIONS.main;
}
export function resolvePhone(loc: Location): string {
  return loc.phone || site.defaultPhone;
}
export function resolveSocials(loc: Location): readonly Social[] {
  return loc.socials ?? site.socials;
}
