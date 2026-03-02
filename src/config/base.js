/**
 * Base URL for the app (e.g. '/' locally, '/africapolis/' on GitHub Pages).
 * Use for static assets in public/ (images, data JSON) so they work under any base.
 */
export const BASE = import.meta.env.BASE_URL

/** Path to a public asset (no leading slash). Example: asset('data/statistics/json/foo.json') */
export function asset(path) {
  const p = path.startsWith('/') ? path.slice(1) : path
  return BASE + p
}
