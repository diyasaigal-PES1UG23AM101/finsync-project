// frontend/src/components/QRScannerModal.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

const QRScannerModal = ({ onClose, onDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [videoReady, setVideoReady] = useState(false);

  const stopStream = useCallback(() => {
    try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch {}
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks ? streamRef.current.getTracks() : [];
        tracks.forEach(t => t.stop && t.stop());
      }
    } catch {}
  }, []);

  const decodeFrame = useCallback(() => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;

      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(video, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });

        if (code && code.data) {
          stopStream();
          onDetected(code.data.trim());
          return;
        }
      }
    } catch {}
    rafRef.current = requestAnimationFrame(decodeFrame);
  }, [onDetected, stopStream]);

  useEffect(() => {
    (async () => {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setError('Camera requires a secure connection (HTTPS).');
        setHint('Open this site via https:// (or use a dev tunnel).');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not supported on this browser.');
        setHint('Try Chrome (Android) or Safari (iOS).');
        return;
      }

      try {
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;

        const onLoaded = async () => {
          try { await video.play(); } catch {}
          setVideoReady(true);
          decodeFrame();
        };
        if (video.readyState >= 1) onLoaded();
        else video.addEventListener('loadedmetadata', onLoaded, { once: true });
      } catch (e) {
        console.error('[QRScanner] getUserMedia error:', e);
        const name = (e && e.name) || '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('Camera permission denied.');
          setHint('Tap the URL bar lock → Allow Camera, then reopen the scanner.');
        } else if (name === 'NotFoundError') {
          setError('No camera found.');
        } else {
          setError('Camera not available.');
        }
      }
    })();

    return () => { stopStream(); };
  }, [decodeFrame, stopStream]);

  const onImageUpload = (evt) => {
    try {
      const file = evt.target.files && evt.target.files[0];
      if (!file) return;

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
        if (code?.data) {
          onDetected(code.data.trim());
        } else {
          setError('Could not detect a QR in the image.');
        }
      };
      img.onerror = () => setError('Failed to load image.');
      img.src = URL.createObjectURL(file);
    } catch {
      setError('Failed to process the selected image.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 active:scale-95"
            aria-label="Close scanner"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error ? (
            <>
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>
              {hint ? <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">{hint}</div> : null}
            </>
          ) : (
            <>
              <div className="w-full bg-black rounded-xl overflow-hidden max-h-[80vh] flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-auto object-contain"
                  playsInline
                  autoPlay
                  muted
                />
              </div>

              {!videoReady && (
                <div className="text-center text-sm text-gray-600">Initializing camera…</div>
              )}

              <p className="text-sm text-gray-600">
                Point your camera at a UPI QR. It will automatically detect and open your UPI app.
              </p>
            </>
          )}

          <div className="text-center">
            <label className="inline-block cursor-pointer text-sm text-blue-600 hover:underline">
              Or upload a photo of the QR
              <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
            </label>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
