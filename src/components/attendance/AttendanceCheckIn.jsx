import { useCallback, useMemo, useRef, useState } from 'react';
import QrScanner from '../qr/QrScanner.jsx';
import { fullName } from '../../utils/format.js';

export default function AttendanceCheckIn({
  members,
  openRecords,
  onCheckIn,
  onCheckOut,
  error,
  success,
  onClearMessages,
  onResumeScanner,
  onScanError,
}) {
  const [mode, setMode] = useState('scan');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastSuccess, setLastSuccess] = useState(null);
  const scanLockRef = useRef(false);
  const lastTokenRef = useRef('');

  const openByMemberId = useMemo(() => {
    const map = new Map();
    for (const r of openRecords) {
      map.set(r.memberId, r);
    }
    return map;
  }, [openRecords]);

  const eligibleMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => {
        if (m.paymentStatus === 'UNPAID') return false;
        if (openByMemberId.has(m.id)) return false;
        if (!q) return true;
        const name = fullName(m.user).toLowerCase();
        const email = (m.user?.email ?? '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .sort((a, b) => fullName(a.user).localeCompare(fullName(b.user)));
  }, [members, openByMemberId, search]);

  const inGym = useMemo(() => openRecords.filter((r) => !r.checkOutAt), [openRecords]);

  const runCheckIn = useCallback(
    async (payload) => {
      setProcessing(true);
      onClearMessages?.();
      const result = await onCheckIn(payload);
      setProcessing(false);
      if (result?.ok) {
        setLastSuccess({
          name: result.name,
          method: payload.method ?? (payload.qrToken ? 'QR' : 'MANUAL'),
        });
      }
      return result;
    },
    [onCheckIn, onClearMessages],
  );

  const onQrScan = useCallback(
    async (decoded) => {
      if (scanLockRef.current || processing || !decoded?.trim()) return;
      const token = decoded.trim();
      if (token === lastTokenRef.current) return;

      scanLockRef.current = true;
      lastTokenRef.current = token;

      await runCheckIn({ qrToken: token, method: 'QR' });

      window.setTimeout(() => {
        scanLockRef.current = false;
        lastTokenRef.current = '';
      }, 1000);
    },
    [processing, runCheckIn],
  );

  const onMemberTap = async (member) => {
    if (processing) return;
    await runCheckIn({ memberId: member.id, method: 'MANUAL' });
    setSearch('');
  };

  const onQuickCheckOut = async (record) => {
    if (processing) return;
    setProcessing(true);
    onClearMessages?.();
    await onCheckOut(record.id);
    setProcessing(false);
  };

  return (
    <div className="space-y-5">
      {/* Mode switch */}
      <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
        {[
          { id: 'scan', label: 'Scan QR', icon: '📷' },
          { id: 'manual', label: 'Pick member', icon: '👤' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              onClearMessages?.();
            }}
            className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
              mode === m.id
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span aria-hidden>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Status banner */}
      {(success || error || lastSuccess) && (
        <div
          className={`rounded-xl border p-4 ${
            error ? 'border-red-500/30 bg-red-500/10' : 'border-teal-500/30 bg-teal-500/10'
          }`}
        >
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && !error && <p className="text-sm text-teal-400">{success}</p>}
          {lastSuccess && !error && (
            <p className="text-sm text-teal-300">
              ✓ {lastSuccess.name} checked in ({lastSuccess.method})
            </p>
          )}
          {error && mode === 'scan' && (
            <button
              type="button"
              onClick={onResumeScanner}
              className="mt-3 min-h-[44px] rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
            >
              Continue scanning
            </button>
          )}
        </div>
      )}

      {/* Currently in gym — quick checkout */}
      {inGym.length > 0 && (
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-300">In gym now ({inGym.length})</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {inGym.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={processing}
                onClick={() => onQuickCheckOut(r)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-amber-500/40 bg-slate-900/80 px-4 py-2 text-sm text-white hover:bg-amber-500/10 disabled:opacity-50"
              >
                <span>{fullName(r.member?.user)}</span>
                <span className="text-xs text-amber-400">Check out</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {mode === 'scan' && (
        <section className="w-full">
          <div className="relative mx-auto w-full max-w-xl">
            <QrScanner
              active={mode === 'scan' && !processing}
              onScan={onQrScan}
              onError={(msg) => onScanError?.(msg)}
            />
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                <p className="text-sm font-medium text-white">Checking in…</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500 sm:text-left">
            Hold the member&apos;s QR from their profile in the frame. Scanning continues
            automatically after each check-in.
          </p>
        </section>
      )}

      {mode === 'manual' && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <label className="mb-2 block text-xs font-medium text-slate-400">Search member</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email…"
            autoComplete="off"
            className="mb-4 w-full min-h-[48px] rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-base text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />

          {eligibleMembers.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              {search
                ? 'No matching members found'
                : 'All paid members are already checked in, or none are available'}
            </p>
          ) : (
            <ul className="grid max-h-[min(50vh,420px)] gap-2 overflow-y-auto sm:grid-cols-2">
              {eligibleMembers.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => onMemberTap(m)}
                    className="flex w-full min-h-[56px] items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-left transition hover:border-teal-500/50 hover:bg-slate-800 disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{fullName(m.user)}</p>
                      <p className="truncate text-xs text-slate-500">
                        {m.membershipPlan?.name ?? 'No plan'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white">
                      Check in
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {members.some((m) => m.paymentStatus === 'UNPAID') && (
            <p className="mt-4 text-xs text-slate-500">
              Unpaid members are hidden until they complete membership payment.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
