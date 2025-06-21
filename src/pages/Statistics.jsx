import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Jednoduchá karta pro číslo + popisek
const StatCard = ({ title, value, unit = '' }) => (
  <div style={{
    background: 'white', padding: '1rem', borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center'
  }}>
    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
      {value} {unit}
    </div>
    <div style={{ fontSize: '1rem', color: '#6b7280' }}>{title}</div>
  </div>
);

const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

const Statistics = ({ onBack }) => {
  // 1) Stav pro datumové filtry
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState(today);

  // 2) Stav pro data
  const [stats,       setStats]       = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // 3) Funkce pro načtení všech dat
  const fetchAll = async (from, to) => {
    setLoading(true);
    setError('');
    try {
      // 3.1 Souhrn statistik
      const { data: statData, error: statErr } = await supabase
        .rpc('get_owner_stats', { start_date: from, end_date: to });
      if (statErr) throw statErr;
      setStats(statData[0] || {});

      // 3.2 Seznam transakcí
      const { data: txData, error: txErr } = await supabase
        .rpc('get_transactions_by_range', { start_date: from, end_date: to });
      if (txErr) throw txErr;
      setTransactions(txData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4) Při mountu načíst s dnešním datem
  useEffect(() => {
    fetchAll(startDate, endDate);
  }, []);

  if (loading) return <div style={{padding: '2rem'}}>Načítám...</div>;
  if (error)   return <div style={{ color: 'red', padding: '2rem' }}>Chyba: {error}</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        &larr; Zpět
      </button>

      <h2 style={{ marginBottom: '1rem' }}>Přehled a Statistiky</h2>

      {/* 1) Souhrn zákazníků a operátorů */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <StatCard title="Celkem zákazníků" value={stats.total_customers} />
        <StatCard title="Celkem operátorů" value={stats.total_operators} />
      </div>

      {/* 2) Datumový filtr */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'
      }}>
        <label>
          Od: <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Do: <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </label>
        <button onClick={() => fetchAll(startDate, endDate)}>
          Filtrovat
        </button>
      </div>

      {/* 3) Prodáno a použito hodin */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <StatCard title="Prodáno hodin" value={stats.sold_hours} unit="hod" />
        <StatCard title="Použito hodin" value={stats.used_hours} unit="hod" />
      </div>

      {/* 4) Tabulka transakcí */}
      <h3 style={{ marginBottom: '0.5rem' }}>Seznam transakcí</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Datum</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Typ</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Hodiny</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Uživatel</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>
                  {new Date(tx.transacted_at).toLocaleString('cs-CZ')}
                </td>
                <td style={{ padding: '0.5rem' }}>{tx.type}</td>
                <td style={{
                  padding: '0.5rem',
                  textAlign: 'right',
                  color: tx.type === 'topup' ? 'green' : 'red'
                }}>
                  {tx.hours > 0 ? '+' : ''}{tx.hours}
                </td>
                <td style={{ padding: '0.5rem' }}>{tx.user_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statistics;
