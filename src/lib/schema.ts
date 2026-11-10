import { offices, type Office, type OfficeKey } from '../config/offices';
import { schemaData as S } from '../config/schema-data';

const hoursSpec = () => S.hours.map((h) => ({
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: [...h.days],
  opens: h.opens,
  closes: h.closes,
}));

export function officeBySlug(slug: string): Office | undefined {
  return Object.values(offices).find((o) => o.slug === slug);
}

const websiteId = `${S.base}/#website`;
const founderId = `${S.base}/about/#founder`;

const imageNode = () => ({ '@type': 'ImageObject', url: S.image, width: S.imageSize.width, height: S.imageSize.height });

const placeNode = (a: (typeof S.areaServed)[number]) => ({ '@type': a.type, name: a.name, sameAs: a.sameAs });

/**
 * The brand. Multi-office model: an Organization with no office-level properties
 * (address, geo, hours, map and ratings belong to the branches in locationNode).
 * BaseLayout emits it on every page.
 */
export function organizationNode() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': S.orgId,
    name: S.name,
    legalName: S.legalName,
    foundingDate: S.foundingDate,
    url: S.url,
    telephone: S.telephone,
    logo: { '@type': 'ImageObject', url: S.logo, width: S.logoSize.width, height: S.logoSize.height },
    image: imageNode(),
    description: S.description,
    email: S.email,
    founder: [{
      '@type': 'Person',
      '@id': founderId,
      name: S.founder.name,
      jobTitle: S.founder.jobTitle,
      hasCredential: [{
        '@type': 'EducationalOccupationalCredential',
        name: 'ALOA Security Professionals Association Member',
        credentialCategory: 'Professional Membership',
        identifier: S.founder.credentialId,
        recognizedBy: { '@type': 'Organization', name: 'Associated Locksmiths of America', sameAs: 'https://en.wikipedia.org/wiki/Associated_Locksmiths_of_America' },
      }],
      knowsAbout: [...S.founder.knowsAbout],
    }],
    contactPoint: { '@type': 'ContactPoint', telephone: S.telephone, email: S.email, contactType: 'customer service', availableLanguage: 'English' },
    priceRange: S.priceRange,
    currenciesAccepted: S.currenciesAccepted,
    paymentAccepted: S.paymentAccepted,
    areaServed: { '@type': 'AdministrativeArea', name: 'North Central Florida', containsPlace: S.areaServed.map(placeNode) },
    sameAs: [...S.sameAs],
    memberOf: S.memberOf.map((m) => ({ '@type': 'Organization', name: m.name, sameAs: m.sameAs })),
    subOrganization: [
      { '@id': `${S.base}/service-areas/${offices.gainesville.slug}/#localbusiness` },
      { '@id': `${S.base}/service-areas/${offices.ocala.slug}/#localbusiness` },
    ],
  };
}

/**
 * Reference to the brand by @id alone, for provider / publisher /
 * hiringOrganization. No inline @type: the brand is defined once per page by
 * BaseLayout, and a second type on the same @id would conflict when merged.
 */
export function organizationRef() {
  return { '@id': S.orgId };
}

export function websiteNode() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': websiteId, url: S.url, name: S.name, publisher: organizationRef() };
}

export type WebPageType = 'WebPage' | 'AboutPage' | 'ContactPage';

export function webPageNode({ type, url, name, description }: { type: WebPageType; url: string; name: string; description?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    ...(description ? { description } : {}),
    isPartOf: { '@id': websiteId },
    about: organizationRef(),
  };
}

/** Blog author. Posts by the owner point at the founder defined on the brand node. */
export function authorNode(name?: string) {
  return name === S.founder.name
    ? { '@type': 'Person', '@id': founderId, name }
    : { '@type': 'Person', name: name ?? S.name };
}

/**
 * A city with no verified Google Business Profile is a Service, never a branch.
 * Only the two offices in offices.ts earn a Locksmith node.
 */
export function cityServiceNode({ city, slug, description }: { city: string; slug: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Locksmith Service in ${city}, FL`,
    serviceType: 'Locksmith',
    description,
    url: `${S.base}/service-areas/${slug}/`,
    areaServed: `${city}, Florida`,
    provider: organizationRef(),
  };
}

function officeForLocation(location?: string): Office | undefined {
  return location && location in offices ? offices[location as OfficeKey] : undefined;
}

/**
 * areaServed for a Service node. A page scoped to one office claims only that
 * city; shared pages claim the full canonical service area, matching the
 * Organization node. Never hardcode a single city here — a service page that
 * serves both offices must say so.
 */
export function serviceAreaServed(location?: string) {
  const all = S.areaServed.map(placeNode);
  const office = officeForLocation(location);
  return office ? all.filter((a) => a.name === office.city) : all;
}

/** Geo suffix for a Service node's name — one city when scoped, both offices otherwise. */
export function serviceGeoLabel(location?: string) {
  const office = officeForLocation(location);
  if (office) return `${office.city}, ${office.state}`;
  const { gainesville, ocala } = offices;
  return `${gainesville.city} & ${ocala.city}, ${gainesville.state}`;
}

export function locationNode(key: OfficeKey) {
  const o = offices[key];
  return {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    '@id': `${S.base}/service-areas/${o.slug}/#localbusiness`,
    name: o.schemaName,
    url: `${S.base}/service-areas/${o.slug}/`,
    image: imageNode(),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: `${o.label} Service Area`,
      containsPlace: S.areaServed.filter((a) => a.office === key).map(placeNode),
    },
    telephone: o.trackingPhone,
    email: o.email,
    address: { '@type': 'PostalAddress', streetAddress: o.streetSchema, addressLocality: o.city, addressRegion: o.state, postalCode: o.zip, addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: o.geo.lat, longitude: o.geo.lng },
    hasMap: `https://www.google.com/maps/place/?cid=${o.cid}`,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: o.ratingValue, reviewCount: o.reviewCount, bestRating: '5', worstRating: '1' },
    openingHoursSpecification: hoursSpec(),
    amenityFeature: o.accessibility.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
    priceRange: S.priceRange,
    sameAs: [...o.sameAs],
    parentOrganization: { '@id': S.orgId },
  };
}
