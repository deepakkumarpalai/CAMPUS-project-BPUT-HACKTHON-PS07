import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function VisitorCameraScanner({ onScan }) {
  const onScanRef = useRef(onScan);
  const scanLock = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('visitor-qr-reader', { fps: 10, qrbox: { width: 220, height: 220 } }, false);
    scanner.render((decodedText) => {
      if (scanLock.current) return;
      scanLock.current = true;
      onScanRef.current(decodedText);
    }, () => {});
    return () => { scanner.clear().catch(() => {}); };
  }, []);

  return <div id="visitor-qr-reader" className="max-w-md" />;
}