import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function clearScannerElement(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = '';
  }
}

export default function QrScanner({ onScan, onError, active = true }) {
  const [started, setStarted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const startingRef = useRef(false);
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

    const stopScanner = async () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      try {
        if (s.isScanning) {
          await s.stop();
        }
        await s.clear();
      } catch {
        // ignore cleanup errors
      }
      clearScannerElement(regionId);
    };

    const start = async () => {
      if (startingRef.current) return;
      startingRef.current = true;
      setCameraError('');
      setStarted(false);
      clearScannerElement(regionId);

      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras?.length) {
          throw new Error('No camera found on this device');
        }

        const backCamera = cameras.find((c) =>
          /back|rear|environment/i.test(c.label ?? ''),
        );
        const cameraId = backCamera?.id ?? cameras[cameras.length - 1].id;

        const scanner = new Html5Qrcode(regionId);
        scannerRef.current = scanner;

        await scanner.start(
          cameraId,
          {
            fps: 10,
            aspectRatio: 1.333,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const edge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(edge * 0.65);
              return { width: size, height: size };
            },
          },
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
        await stopScanner();
      } finally {
        startingRef.current = false;
      }
    };

    start();

    return () => {
      cancelled = true;
      startingRef.current = false;
      stopScanner();
      setStarted(false);
    };
  }, [active, regionId]);

  return (
    <div className="fitcore-qr-scanner relative overflow-hidden rounded-xl border border-slate-700 bg-black">
      <div id={regionId} className="fitcore-qr-scanner__region" />
      {!started && !cameraError && (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-black/70 p-3 text-center text-sm text-slate-400">
          Starting camera…
        </p>
      )}
      {cameraError && (
        <p className="p-4 text-center text-sm text-red-400">{cameraError}</p>
      )}
    </div>
  );
}
