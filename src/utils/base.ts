// import.meta.env.BASE_URL does not reliably include a trailing slash
// (it reflects the `base` value from astro.config.mjs as-is). Normalize it
// here once so every href built as `${base}blog/...` is well-formed.
export function siteBase(rawBase: string): string {
  return rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
}
