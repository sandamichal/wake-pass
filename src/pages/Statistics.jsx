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
      {value}{unit && <span style={{ fontSize: '1.5rem' }}> {unit}</span>}
    </div>
    <div style={{ fontSize: '1rem', color: '#6b7280' }}>{title}</div>
  </div>
);

const Statistics = ({ onBack }) => {
  // Dnesní datum ve formátu YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  // Stav pro čísla
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState('');

  // Stav pro transakce
  const [txs, setTxs] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [errorTx, setErrorTx] = useState('');

  // Filtry
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]   = useState(today);
  const [showTopup, setShowTopup] = useState(true);
  const [showUsage, setShowUsage] = useState(true);

  // Načíst statistiky (počty a sumy hodin)
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setErrorStats('');
      try {
        const { data, error } = await supabase
          .rpc('get_owner_stats', {
            start_date: startDate,
            end_date:   endDate,
          });
        if (error) throw error;
        setStats(data[0]);
      } catch (err) {
        setErrorStats('Chyba při načítání statistik: ' + err.message);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [startDate, endDate]);

  // Načíst transakce pro zvolený rozsah
  useEffect(() => {
    const fetchTx = async () => {
      setLoadingTx(true);
      setErrorTx('');
      try {
        const { data, error } = await supabase
          .rpc('get_transactions_by_range', {
            start_date: startDate,
            end_date:   endDate,
          });
        if (error) throw error;
        setTxs(data);
      } catch (err) {
        setErrorTx('Chyba při načítání transakcí: ' + err.message);
      } finally {
        setLoadingTx(false);
      }
    };
    fetchTx();
  }, [startDate, endDate]);

  // Aplikovat filtr podle typu
  const filteredTx = txs.filter(tx =>
    (showTopup && tx.type === 'topup')
    || (showUsage && tx.type === 'usage')
  );

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        ← Zpět do menu
      </button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Přehled a Statistiky
      </h2>

      {/* Filtry */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <label>
          Od:&nbsp;
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Do:&nbsp;
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={showTopup}
            onChange={() => setShowTopup(!showTopup)}
          /> Nabití permanentky
        </label>
        <label>
          <input
            type="checkbox"
            checked={showUsage}
            onChange={() => setShowUsage(!showUsage)}
          /> Použití permanentky
        </label>
      </div>

      {/* Statistické karty */}
      {errorStats
        ? <div style={{ color: 'red', marginBottom: '1rem' }}>{errorStats}</div>
        : loadingStats
          ? <div>Načítám statistiky…</div>
          : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <StatCard title="Celkem zákazníků" value={stats.total_customers} />
              <StatCard title="Celkem operátorů" value={stats.total_operators} />
              <StatCard title="Prodáno hodin" value={stats.sold_hours} unit="hod" />
              <StatCard title="Použito hodin" value={stats.used_hours} unit="hod" />
            </div>
          )
      }

      {/* Tabulka transakcí */}
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
              {filteredTx.map(tx => (
                <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>
                    {new Date(tx.transacted_at).toLocaleString('cs-CZ', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {tx.type === 'topup'
                      ? 'Nabití permanentky'
                      : 'Použití permanentky'}
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {tx.hours > 0 ? `+${tx.hours}` : tx.hours}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{tx.user_name}</td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
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
