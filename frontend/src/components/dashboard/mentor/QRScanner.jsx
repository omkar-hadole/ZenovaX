import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { apiCall } from '../../../utils/api';

export default function QRScanner({ onClose }) {
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner", error);
                });
            }
        };
    }, []);

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (isVerifying) return;

        try {
            // Pause scanning
            if (scannerRef.current) {
                scannerRef.current.pause();
            }

            setIsVerifying(true);
            setError(null);

            // Parse QR Data
            let data;
            try {
                data = JSON.parse(decodedText);
            } catch (e) {
                throw new Error("Invalid QR Code format");
            }

            if (data.type !== 'ZENOVAX_TICKET' || !data.bookingId || !data.sessionId) {
                throw new Error("Not a ZenovaX Ticket");
            }

            // Verify with Backend
            const response = await apiCall('/sessions/verify-attendance', 'POST', {
                bookingId: data.bookingId,
                sessionId: data.sessionId
            });

            setScanResult({
                success: true,
                user: response.user,
                message: response.message
            });

        } catch (err) {
            console.error("Verification failed:", err);
            setError(err.message || "Verification Failed");
            setScanResult({
                success: false
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const resetScanner = () => {
        setScanResult(null);
        setError(null);
        setIsVerifying(false);
        if (scannerRef.current) {
            scannerRef.current.resume();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 text-center border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        <Camera className="text-indigo-600" />
                        Scan Ticket
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                        Point camera at student's QR code
                    </p>
                </div>

                <div className="p-4 bg-gray-50 min-h-[300px] flex flex-col items-center justify-center">
                    {/* Scanner Container */}
                    {!scanResult && (
                        <div id="reader" className="w-full rounded-xl overflow-hidden shadow-inner"></div>
                    )}

                    {/* Verification Result */}
                    {scanResult && (
                        <div className={`text-center p-6 rounded-2xl w-full ${scanResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${scanResult.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {scanResult.success ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                            </div>

                            <h4 className={`text-lg font-bold mb-1 ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                {scanResult.success ? 'Access Granted' : 'Access Denied'}
                            </h4>

                            {scanResult.success && (
                                <div className="mt-2 text-green-700 bg-green-100/50 py-2 px-4 rounded-lg inline-block">
                                    <p className="font-semibold">{scanResult.user?.name}</p>
                                    <p className="text-xs opacity-75">{scanResult.user?.email}</p>
                                </div>
                            )}

                            {error && (
                                <p className="text-red-600 font-medium mt-2">{error}</p>
                            )}

                            <button
                                onClick={resetScanner}
                                className={`mt-6 w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-transform active:scale-95
                            ${scanResult.success ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
                        `}
                            >
                                Scan Next
                            </button>
                        </div>
                    )}

                    {isVerifying && (
                        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-indigo-600">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                            <span className="font-bold">Verifying Ticket...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
