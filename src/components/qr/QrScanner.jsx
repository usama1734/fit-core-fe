import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScanner({ onScan, onError, active = true }) {
  const [started, setStarted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const regionId = `fitcore-qr-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!active) {
      setStarted(false);
      return undefined;
    }

    let cancelled = false;
    let scanner;

    const stopScanner = async () => {
      const s = scannerRef.current;
      if (!s) return;
      try {
        if (s.isScanning) {
          await s.stop();
        }
        await s.clear();
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    };

    const start = async () => {
      setCameraError('');
      setStarted(false);

      try {
        scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras?.length) {
          throw new Error('No camera found on this device');
        }

        const backCamera = cameras.find(
          (c) =>
            /back|rear|environment/i.test(c.label) ||
            /back|rear|environment/i.test(String(c.id)),
        );
        const cameraId = backCamera?.id ?? cameras[cameras.length - 1].id;

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            if (!cancelled) onScanRef.current(decoded);
          },
          () => {},
        );

        if (!cancelled) setStarted(true);
      } catch (err) {
        const message = err?.message || 'Camera access denied';
        if (!cancelled) {
          setCameraError(message);
          onErrorRef.current?.(message);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stopScanner();
      setStarted(false);
    };
  }, [active, regionId]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-black">
      <div id={regionId} className="min-h-[280px] w-full" />
      {!started && (
        <p className="p-4 text-center text-sm text-slate-400">
          {cameraError || 'Starting camera…'}
        </p>
      )}
    </div>
  );
}
