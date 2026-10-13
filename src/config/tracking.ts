// Google Ads (gtag) tag.
//
// GA4 loads gtag.js on every page (see BaseLayout.astro), so the Ads tag is just an
// extra `gtag('config', ...)` call on every page that renders through BaseLayout —
// no second loader script.
//
// The standalone ads landing pages in public/ (/new-home/, /commercial/) don't use
// BaseLayout and carry their own copy of this tag, so they never get it twice.
//
// The base tag on its own does not record a conversion. It powers remarketing
// audiences and any conversion action defined by URL rule inside the Google Ads UI.
// A click/submit conversion would additionally need an event snippet with a
// conversion label.
export const adsConversionId = 'AW-1003919115';
