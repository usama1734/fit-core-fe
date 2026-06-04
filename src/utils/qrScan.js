/**
 * Parse QR scan result for attendance desk flow.
 * @returns {{ kind: 'member' | 'venue' | null, token: string } | null}
 */
export function parseAttendanceQrScan(raw) {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const t = url.searchParams.get('t') ?? url.searchParams.get('token');
      if (t?.trim()) return { kind: 'member', token: t.trim() };

      const k = url.searchParams.get('k');
      if (k?.trim()) {
        if (k.trim().startsWith('FC-GYM-')) {
          return { kind: 'venue', token: k.trim() };
        }
        return { kind: 'member', token: k.trim() };
      }
    } catch {
      // fall through
    }
  }

  if (trimmed.startsWith('FC-GYM-')) {
    return { kind: 'venue', token: trimmed };
  }

  if (trimmed.startsWith('FC-')) {
    return { kind: 'member', token: trimmed };
  }

  return { kind: 'member', token: trimmed };
}

export function buildMemberDeskQrValue(qrToken) {
  if (!qrToken) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/desk-check-in?t=${encodeURIComponent(qrToken)}`;
}
