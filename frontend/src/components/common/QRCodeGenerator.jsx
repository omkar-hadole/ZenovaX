import React from 'react';
import QRCode from 'react-qr-code';

export default function QRCodeGenerator({ bookingId, sessionId, userEmail }) {
    // Determine what data to encode. 
    // We encode a JSON string with key identifiers so the scanner can verify it against the backend.
    // Including random salt or signature could be better for security, but for now we rely on the bookingId being a UUID.
    const qrData = JSON.stringify({
        bookingId,
        sessionId,
        type: 'ZENOVAX_TICKET'
    });

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-4">
                <QRCode
                    value={qrData}
                    size={200}
                    level="H" // High error correction
                    className="w-full h-auto"
                />
            </div>

            <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticket ID</p>
                <p className="text-sm font-mono text-gray-700 break-all px-4">{bookingId}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 w-full text-center">
                <p className="text-xs text-gray-400">Show this code at the venue entrance</p>
            </div>
        </div>
    );
}
