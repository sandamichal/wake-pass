// src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StatCard = ({ title, value, unit }) => (
  <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      textAlign: 'center',
    }}>
    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
      {value} {unit && <span style={{ fontSize: '1.5rem' }}>{unit}</span>}
    </div>
    <div style={{ fontSize: '1rem', color: '#6b7280' }}>{title}</div>
  </div>
);

const Statistics = ({ onBack }) => {
  // 1) výchozí dnešní datum ve formátu YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]   = useState(today);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // 2) funkce pro volání RPC s parametry
  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_owner_stats', {
          _start_date: startDate,
          _end_date: endDate,
        });
      if (rpcError) throw rpcError;
      setStats(data);
    } catch (err) {
      console.error('get_owner_stats RPC error', err);
      setError('Nepodařilo se načíst statistiky: ' + err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // 3) znovu načíst vždy, když se změní datum
  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  // 4) loading / error stav
  if (loading) return <div>Načítám statistiky…</div>;
  if (error)   return <div style={{ color: 'red' }}>{error}</div>;
  if (!stats)  return null;

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        ← Zpět do menu
      </button>
      <h2 style={{ marginBottom: '1rem' }}>Přehled a Statistiky</h2>

      <div style={{ marginBottom: '2rem' }}>
        <label>
          Od:{' '}
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: '1rem' }}>
          Do:{' '}
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard title="Celkem zákazníků" value={stats.total_customers} />
        <StatCard title="Celkem operátorů" value={stats.total_operators} />
        <StatCard title="Prodáno hodin"   value={stats.sold_hours} unit="hod" />
        <StatCard title="Použito hodin"   value={stats.used_hours} unit="hod" />
      </div>

      {/* -- Tabulka transakcí */}
      {errorTx && <div style={{ color: 'red' }}>{errorTx}</div>}
      {loadingTx
        ? <div>Načítám transakce…</div>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Čas</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Typ</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Hodiny</th>
                <th style={{ padding: '0.5rem', textAlign: 'left' }}>Uživatel</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map(tx => {
                const isTopup = tx.type === 'topup';
                const disp = isTopup ? `+${tx.hours}` : tx.hours;
                return (
                  <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem' }}>
                      {new Date(tx.transacted_at).toLocaleString('cs-CZ', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {isTopup ? 'Nabití permanentky' : 'Použití permanentky'}
                    </td>
                    <td style={{
                      padding: '0.5rem',
                      textAlign: 'right',
                      color:   isTopup ? '#16a34a' : '#ef4444',
                      fontWeight: 'bold'
                    }}>
                      {disp}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{tx.user_name}</td>
                  </tr>
                );
              })}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={4} style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    Žádné transakce pro zvolenou kombinaci.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )
      }
    </div>
  );
};

export default Statistics;
