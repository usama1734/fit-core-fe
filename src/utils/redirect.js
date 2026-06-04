export function getSafeRedirect(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const path = decodeURIComponent(raw);
    if (path.startsWith('/') && !path.startsWith('//')) return path;
  } catch {
    return null;
  }
  return null;
}
