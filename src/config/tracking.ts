// Google Ads (gtag) tag.
//
// GA4 loads gtag.js on every page (see BaseLayout.astro), so the Ads tag is just an
// extra `gtag('config', ...)` call on the pages listed here — no second loader script.
//
// The base tag on its own does not record a conversion. It powers remarketing
// audiences and any conversion action defined by URL rule inside the Google Ads UI.
// A click/submit conversion would additionally need an event snippet with a
// conversion label.
export const adsConversionId = 'AW-1003919115';

// Paths that get the Ads tag. Must include the trailing slash (astro.config.mjs
// sets `trailingSlash: 'always'`). Add a path here to tag another page.
export const adsTagPaths = [
  '/services/smart-lock-installation/',
  '/services/lock-rekeying/',
];
