// soubor: src/pages/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

const CustomerDashboard = ({ user }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [amountToUse, setAmountToUse] = useState(1); // Nový stav pro počet vstupů

  const userName = user.user_metadata?.full_name || user.email;

  useEffect(() => {
    const fetchPassBalance = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('passes').select('entries_balance').eq('user_id', user.id).single();
        if (error) throw error;
        if (data) setBalance(data.entries_balance);
      } catch (err) {
        console.error('Chyba při načítání permanentky:', err);
        setError('Nepodařilo se načíst data o permanentce.');
      } finally {
        setLoading(false);
      }
    };
    fetchPassBalance();
  }, [user.id]);

  const handleUseEntry = async () => {
    if (amountToUse <= 0 || amountToUse > balance) {
        setError('Zadaný počet vstupů je neplatný nebo vyšší než váš zůstatek.');
        return;
    }
    setIsGeneratingQr(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('create_qr_nonce', { 
        amount_to_use: amountToUse 
      });

      if (error) throw error;
      setQrToken(data);
    } catch (err) {
      setError('Nepodařilo se vygenerovat QR kód. Zkuste to znovu.');
      console.error(err);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  if (qrToken) {
    return (
      <div style={{ background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '1rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Ukažte tento kód operátorovi</h2>
        <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>Počet vstupů k odečtení: {amountToUse}</p>
        <QRCodeSVG value={qrToken} size={256} style={{ margin: '1rem 0', maxWidth: '80vw', height: 'auto' }} />
        <button onClick={() => setQrToken(null)} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#4b5563', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          Zavřít
        </button>
        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6b7280', textAlign: 'center' }}>Kód je platný 2 minuty.</p>
      </div>
    );
  }

  const renderBalanceCard = () => {
    if (loading) {
      return <p>Načítám permanentku...</p>;
    }
    if (error) {
      return <p style={{ color: 'red' }}>{error}</p>;
    }
    return (
      <>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Váš aktuální zůstatek</p>
        <p style={{ fontSize: '5rem', fontWeight: '800', color: '#3b82f6', margin: '0.5rem 0', lineHeight: '1' }}>
          {balance}
        </p>
        <p style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '600' }}>VSTUPŮ</p>
      </>
    );
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Ahoj, {userName}!</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '0.875rem', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          Odhlásit se
        </button>
      </header>

      <main style={{ textAlign: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', marginBottom: '2.5rem' }}>
          {renderBalanceCard()}
        </div>
        
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Použít vstup</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem'}}>
                <label htmlFor="amount">Počet vstupů:</label>
                <input
                    id="amount"
                    type="number"
                    value={amountToUse}
                    onChange={(e) => setAmountToUse(Number(e.target.value))}
                    style={{ padding: '0.5rem', width: '6rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', textAlign: 'center' }}
                    step="0.5"
                    min="0.5"
                />
            </div>
            <button
                onClick={handleUseEntry}
                disabled={loading || isGeneratingQr || balance === 0 || amountToUse > balance}
                style={{ width: '100%', background: '#16a34a', color: 'white', fontSize: '1.25rem', fontWeight: 'bold', padding: '1rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', cursor: 'pointer', opacity: (loading || isGeneratingQr || balance === 0 || amountToUse > balance) ? 0.5 : 1 }}
            >
                {isGeneratingQr ? 'Generuji kód...' : 'POUŽÍT VSTUP (QR KÓD)'}
            </button>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;