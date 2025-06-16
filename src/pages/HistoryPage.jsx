// soubor: src/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const HistoryPage = ({ onBack }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: rpcError } = await supabase.rpc('get_my_transactions');
        if (rpcError) throw rpcError;
        setTransactions(data || []);
      } catch (err) {
        setError('Nepodařilo se načíst historii transakcí: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const transactionStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: '1px solid #eee',
  };

  if (loading) {
    return <div>Načítám historii...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1rem', background: 'none', border: '1px solid #ccc', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
        &larr; Zpět na přehled
      </button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Historie Transakcí</h2>
      
      {transactions.length === 0 ? (
        <p>Zatím zde nejsou žádné transakce.</p>
      ) : (
        <div style={{ border: '1px solid #ddd', borderRadius: '0.5rem' }}>
          {transactions.map(tx => (
            <div key={tx.id} style={transactionStyle}>
              <div>
                <span style={{ fontWeight: 'bold', color: tx.type === 'topup' ? 'green' : 'red' }}>
                  {tx.type === 'topup' ? 'Nabití' : 'Použití'}
                </span>
                <br />
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {formatDate(tx.created_at)}
                </span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: tx.type === 'topup' ? 'green' : 'red' }}>
                {tx.type === 'topup' ? `+${Number(tx.amount).toLocaleString('cs-CZ')}h` : `${Number(tx.amount).toLocaleString('cs-CZ')}h`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
