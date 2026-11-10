import { site } from '../config/site';

export function buildAreaFaqs(
  area: { city: string; county?: string; zips?: string[] },
): { question: string; answer: string; order: number }[] {
  const zipPart = area.zips && area.zips.length ? `, including ZIP codes ${area.zips.join(', ')}` : '';
  const countyPart = area.county ? ` and the surrounding ${area.county} area` : ' and surrounding areas';
  return [
    { order: 2, question: `Do you serve all of ${area.city}?`,
      answer: `Yes — we cover ${area.city}${countyPart}${zipPart}. As a mobile locksmith, we come to you.` },
    { order: 3, question: `What locksmith services do you offer in ${area.city}?`,
      answer: `Residential, commercial, and automotive locksmith service in ${area.city} — lockouts, rekeying, new lock installation, car key replacement, smart locks, and more.` },
    { order: 4, question: `Are your ${area.city} locksmiths licensed and insured?`,
      answer: `Yes. All of our technicians are fully licensed (#${site.license}) and insured for your protection.` },
  ];
}
