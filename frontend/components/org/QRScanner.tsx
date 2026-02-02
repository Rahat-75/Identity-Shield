
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: any) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onScanError, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 }
        };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config,
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Constant stream of errors when no QR is found is normal for this lib
          }
        );
        
        if (isMounted) setInitializing(false);
      } catch (err: any) {
        console.error("QR Scanner Error:", err);
        if (isMounted) {
            setError(err?.toString() || "Failed to access camera. Please ensure you've granted permissions.");
            setInitializing(false);
        }
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.error("Failed to stop scanner", err);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [onScanSuccess, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Scan Citizen QR Code</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="relative aspect-square w-full bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
            <div id="qr-reader" className="w-full h-full"></div>
            
            {initializing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                <p className="text-sm font-medium">Starting camera...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center text-white gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <div>
                  <p className="font-bold">Camera Error</p>
                  <p className="text-sm text-gray-400 mt-1">{error}</p>
                </div>
                <button 
                   onClick={() => window.location.reload()}
                   className="mt-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold"
                >
                  Refresh Page
                </button>
              </div>
            )}
          </div>
          
          {!error && !initializing && (
            <p className="text-center text-sm text-gray-500 mt-6 italic">
              Position the citizen's Privacy Pass QR code within the frame to scan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
