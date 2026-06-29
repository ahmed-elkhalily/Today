// Convert a CSS text string ("a:b;c:d;") into a React style object.
// Used to render the design's inline-style strings faithfully.
export function css(str) {
  if (!str) return undefined
  const out = {}
  for (const part of str.split(';')) {
    const i = part.indexOf(':')
    if (i < 0) continue
    const key = part.slice(0, i).trim()
    const val = part.slice(i + 1).trim()
    if (!key) continue
    const prop = key.startsWith('--')
      ? key
      : key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    out[prop] = val
  }
  return out
}
