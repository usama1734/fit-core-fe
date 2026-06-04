import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onScan, onError, active = true }) {
  const [started, setStarted] = useState(false);
  const scannerRef = useRef(null);
  const regionId = 'fitcore-qr-region';

  useEffect(() => {
    if (!active) return undefined;

    let scanner;
    let cancelled = false;

    const start = async () => {
      try {
        scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            if (!cancelled) onScan(decoded);
          },
          () => {},
        );
        if (!cancelled) setStarted(true);
      } catch (err) {
        onError?.(err.message || 'Camera access denied');
      }
    };

    start();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s?.isScanning) {
        s.stop().catch(() => {});
      }
      scannerRef.current = null;
      setStarted(false);
    };
  }, [active, onScan, onError]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-black">
      <div id={regionId} className="min-h-[280px] w-full" />
      {!started && (
        <p className="p-4 text-center text-sm text-slate-400">Starting camera…</p>
      )}
    </div>
  );
}
