// src/pages/OperatorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Html5QrcodeScanner } from 'html5-qrcode';

const OperatorDashboard = ({ user }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // QR-code scanner component
  const ScannerComponent = () => {
    useEffect(() => {
      let scanner;
      const onScanSuccess = async (decodedText) => {
        if (isLoading) return;
        // Stop and clear scanner
        if (scanner && scanner.getState() === Html5QrcodeScanner.STATE_SCANNING) {
          scanner.clear().catch(() => {});
        }
        setIsScanning(false);
        setIsLoading(true);
        setMessage('Zpracovávám QR kód...');
        try {
          const { data, error } = await supabase.rpc('use_entry_with_nonce', {
            scanned_nonce: decodedText,
          });
          if (error) throw error;
          setMessage(data.message || 'Hodiny úspěšně odečteny.');
        } catch (err) {
          setMessage(`Chyba: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };

      scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { qrbox: { width: 250, height: 250 }, fps: 10 },
        false
      );
      scanner.render(onScanSuccess, console.error);

      return () => {
        if (scanner && scanner.getState() === Html5QrcodeScanner.STATE_SCANNING) {
          scanner.clear().catch(() => {});
        }
      };
    }, []);

    return (
      <div
        id="qr-reader-container"
        style={{ width: '100%', border: '1px solid silver' }}
      />
    );
  };

  // While scanning: show camera UI
  if (isScanning) {
    return (
      <div style={{ maxWidth: 500, margin: '2rem auto', padding: '1rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Naskenujte QR kód zákazníka
        </h2>
        <ScannerComponent />
        <button
          onClick={() => setIsScanning(false)}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
          disabled={isLoading}
        >
          Zrušit
        </button>
      </div>
    );
  }

  // Main operator view: just the “odebrat hodiny” button and status message
  return (
    <main style={{ padding: '1rem' }}>
      <div
        style={{
          marginBottom: '2rem',
          padding: '1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          background: '#fffbeb',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
          }}
        >
          Odebrat hodiny
        </h2>
        <button
          onClick={() => {
            setIsScanning(true);
            setMessage('');
          }}
          style={{
            width: '100%',
            padding: '0.75rem 1.5rem',
            background: '#f97316',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
          disabled={isLoading}
        >
          📸 Naskenovat QR kód
        </button>
      </div>

      {message && (
        <p
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#f3f4f6',
            borderRadius: '0.25rem',
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
};

export default OperatorDashboard;
