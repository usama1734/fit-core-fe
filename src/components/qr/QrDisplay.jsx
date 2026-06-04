import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QrDisplay({ value, size = 220 }) {
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!value) {
      setDataUrl('');
      return;
    }

    let cancelled = false;

    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError('Could not generate QR code');
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!dataUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-white"
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-slate-500">Loading QR…</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="Member attendance QR code"
      width={size}
      height={size}
      className="rounded-xl bg-white p-2 shadow-lg"
    />
  );
}
