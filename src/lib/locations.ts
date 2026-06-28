import { site } from '../config/site';

export type Location = {
  slug: string; phone: string; city: string;
  nap: { street: string; city: string; state: string; zip: string };
  hours: string;
};

const LOCATIONS: Record<string, Location> = {
  main: {
    slug: 'main',
    phone: site.defaultPhone,
    city: 'Gainesville & Ocala',
    nap: { ...site.address },
    hours: site.hours,
  },
};

export function resolveLocation(slug?: string): Location {
  return (slug && LOCATIONS[slug]) || LOCATIONS.main;
}
export function resolvePhone(loc: Location): string {
  return loc.phone || site.defaultPhone;
}
