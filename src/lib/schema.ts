import { offices, type Office, type OfficeKey } from '../config/offices';
import { schemaData as S } from '../config/schema-data';

const hoursSpec = () => [{
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: [...S.hours.days],
  opens: S.hours.opens,
  closes: S.hours.closes,
}];

export function officeBySlug(slug: string): Office | undefined {
  return Object.values(offices).find((o) => o.slug === slug);
}

export function organizationNode({ homepage }: { homepage: boolean }) {
  const node: any = {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    '@id': S.orgId,
    name: S.name,
    legalName: S.legalName,
    foundingDate: S.foundingDate,
    url: S.url,
    logo: { '@type': 'ImageObject', url: S.logo },
    image: S.image,
    description: S.description,
    email: S.email,
    founder: [{
      '@type': 'Person',
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
    ...(homepage ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: offices.gainesville.streetSchema,
        addressLocality: offices.gainesville.city, addressRegion: offices.gainesville.state, postalCode: offices.gainesville.zip, addressCountry: 'US',
      },
    } : {}),
    contactPoint: { '@type': 'ContactPoint', telephone: S.telephone, email: S.email, contactType: 'customer service', availableLanguage: 'English' },
    openingHoursSpecification: hoursSpec(),
    priceRange: S.priceRange,
    currenciesAccepted: S.currenciesAccepted,
    paymentAccepted: S.paymentAccepted,
    areaServed: S.areaServed.map((a) => ({ '@type': a.type, name: a.name, sameAs: a.sameAs })),
    sameAs: [...S.sameAs],
    memberOf: S.memberOf.map((m) => ({ '@type': 'Organization', name: m.name, sameAs: m.sameAs })),
    subOrganization: [
      { '@type': 'Locksmith', '@id': `${S.base}/service-areas/${offices.gainesville.slug}/#localbusiness` },
      { '@type': 'Locksmith', '@id': `${S.base}/service-areas/${offices.ocala.slug}/#localbusiness` },
    ],
  };
  if (homepage) {
    node.aggregateRating = { '@type': 'AggregateRating', ratingValue: S.combinedRating.ratingValue, reviewCount: S.combinedRating.reviewCount, bestRating: '5', worstRating: '1' };
    node.hasOfferCatalog = {
      '@type': 'OfferCatalog', name: 'Locksmith Services',
      itemListElement: S.catalog.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, description: s.description, ...(s.additionalType ? { additionalType: s.additionalType } : {}) },
        ...(s.minPrice ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: s.minPrice, priceCurrency: 'USD', description: 'Starting price — final price depends on vehicle, lock type, and job complexity' } } : {}),
      })),
    };
  }
  return node;
}

export function locationNode(key: OfficeKey) {
  const o = offices[key];
  return {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    '@id': `${S.base}/service-areas/${o.slug}/#localbusiness`,
    name: o.schemaName,
    url: `${S.base}/service-areas/${o.slug}/`,
    telephone: o.trackingPhone,
    email: o.email,
    address: { '@type': 'PostalAddress', streetAddress: o.streetSchema, addressLocality: o.city, addressRegion: o.state, postalCode: o.zip, addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: o.geo.lat, longitude: o.geo.lng },
    hasMap: `https://www.google.com/maps/place/?cid=${o.cid}`,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: o.ratingValue, reviewCount: o.reviewCount, bestRating: '5', worstRating: '1' },
    openingHoursSpecification: hoursSpec(),
    priceRange: S.priceRange,
    sameAs: [...o.sameAs],
    parentOrganization: { '@id': S.orgId },
  };
}
