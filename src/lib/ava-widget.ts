// The client publishes the current content-hashed widget file name at
// widget-version.json. The hashed file is served immutable for a year, so it
// passes Lighthouse's cache audit where the plain /widget.js (one day) does not.
//
// Resolved once per build, not once per page: BaseLayout renders 150+ pages.
// Any failure falls back to the plain /widget.js, which always serves the
// current widget.
//
// Returning visitors keep their cached copy until the next deploy changes the
// name. That is safe because the widget's kill switch (`enabled`) and hours come
// from /web-voice/config.json at runtime, not from the script itself.
const ORIGIN = 'https://be-secure-receptionist.fly.dev';
export const AVA_FALLBACK_SRC = `${ORIGIN}/widget.js`;
const VERSIONED = /^https:\/\/be-secure-receptionist\.fly\.dev\/widget\.[0-9a-f]+\.js$/;

let pending: Promise<string> | undefined;

export function avaWidgetSrc(): Promise<string> {
  pending ??= (async () => {
    try {
      const r = await fetch(`${ORIGIN}/widget-version.json`, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) return AVA_FALLBACK_SRC;
      const { url } = await r.json();
      return typeof url === 'string' && VERSIONED.test(url) ? url : AVA_FALLBACK_SRC;
    } catch {
      return AVA_FALLBACK_SRC;
    }
  })();
  return pending;
}
