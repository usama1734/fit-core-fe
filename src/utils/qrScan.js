/**
 * Parse gym entrance QR scan (raw FC-GYM-… token or legacy URL with ?k=).
 */
export function parseVenueQrScan(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const k = url.searchParams.get('k');
      if (k?.trim()) return k.trim();
    } catch {
      // fall through
    }
  }

  if (trimmed.startsWith('FC-GYM-')) {
    return trimmed;
  }

  return null;
}
