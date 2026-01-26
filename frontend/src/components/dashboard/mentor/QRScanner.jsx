import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import { apiCall } from '../../../utils/api';

export default function QRScanner({ onClose }) {
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [permissionError, setPermissionError] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // We use a ref to hold the instance so we can properly cleanup
    const html5QrCodeRef = useRef(null);
    const isScanningRef = useRef(false);
    const lastScannedCodeRef = useRef(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // 1. Check cameras
                const devices = await Html5Qrcode.getCameras();
                if (!devices || devices.length === 0) {
                    throw new Error("No camera found");
                }

                // 2. Create instance
                const html5QrCode = new Html5Qrcode("reader");
                html5QrCodeRef.current = html5QrCode;

                // 3. Start scanning
                // Prefer the back camera
                const cameraId = devices.length > 1 ? { facingMode: "environment" } : devices[0].id;

                await html5QrCode.start(
                    cameraId,
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    onScanSuccess,
                    onScanFailure
                );
                isScanningRef.current = true;

            } catch (err) {
                console.error("Camera start failed", err);
                setPermissionError(true);
            }
        };

        // Small delay to ensure DOM is ready
        setTimeout(startScanner, 100);

        return () => {
            // Cleanup function
            if (html5QrCodeRef.current && isScanningRef.current) {
                html5QrCodeRef.current.stop().then(() => {
                    html5QrCodeRef.current.clear();
                    isScanningRef.current = false;
                }).catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, []);

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (isVerifying) return;

        // Prevent immediate re-scan of the same code
        if (decodedText === lastScannedCodeRef.current) {
            return;
        }

        try {
            // Pause the scanner logic without stopping the camera stream if possible, 
            // or just ignore subsequent reads using state.
            // For now, we'll keep the camera running but show the overlay.

            // If you want to freeze the video, you'd call pause, but that sometimes causes black screen issues on some devices.
            // Better to just set verifying state and ignore new inputs.
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.pause(true); // Pauses scanning
            }

            setIsVerifying(true);
            setError(null);

            let data;
            try {
                data = JSON.parse(decodedText);
            } catch (e) {
                throw new Error("Invalid QR Code");
            }

            if (data.type !== 'ZENOVAX_TICKET' || !data.bookingId || !data.sessionId) {
                throw new Error("Not a ZenovaX Ticket");
            }

            // Cache the code immediately to prevent loop if API fails (e.g. Already Scanned)
            lastScannedCodeRef.current = decodedText;

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
            // Allow rescanning the same code if it failed (e.g. network error)
            // But if it was "Already Scanned", we also want to allow scanning a NEW code, so we don't set lastScannedCodeRef
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
        if (html5QrCodeRef.current) {
            html5QrCodeRef.current.resume();
        }
    };

    const handleRetry = () => {
        setPermissionError(false);
        onClose();
        setTimeout(() => alert("Please ensure you allow camera permissions."), 500);
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

                <div className="p-4 bg-gray-50 min-h-[350px] flex flex-col items-center justify-center">
                    {permissionError ? (
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                                <AlertCircle size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Camera Access Denied</h4>
                            <p className="text-sm text-gray-600 mb-6">
                                We couldn't access your camera. Please ensure you have granted permission in your browser settings.
                            </p>
                            <button
                                onClick={handleRetry}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold w-full hover:bg-gray-800 transition-colors"
                            >
                                <RefreshCw size={18} />
                                Retry / Check Settings
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Scanner Container - IMPORTANT: Fixed height for video */}
                            {!scanResult && (
                                <div className="w-full relative rounded-xl overflow-hidden bg-black shadow-inner">
                                    <div id="reader" className="w-full h-full"></div>
                                </div>
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
                                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-indigo-600 z-50">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                                    <span className="font-bold">Verifying Ticket...</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
