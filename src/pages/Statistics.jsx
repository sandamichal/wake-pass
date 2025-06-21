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
  // default na dnešní datum YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  // stavy pro statistiky
  const [stats, setStats]         = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats]     = useState('');

  // stavy pro transakce
  const [txs, setTxs]             = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [errorTx, setErrorTx]     = useState('');

  // filtry
  const [startDate, setStartDate]     = useState(today);
  const [endDate,   setEndDate]       = useState(today);
  const [selectedTypes, setSelectedTypes] = useState(['topup','usage']);

  // 1) Načtení statistik
  useEffect(() => {
    setLoadingStats(true);
    setErrorStats('');
    supabase.rpc('get_owner_stats', { start_date: startDate, end_date: endDate })
      .then(({ data, error }) => {
        if (error) throw error;
        setStats(data[0]);
      })
      .catch(e => setErrorStats('Chyba při načítání statistik: ' + e.message))
      .finally(() => setLoadingStats(false));
  }, [startDate, endDate]);

  // 2) Načtení transakcí
  useEffect(() => {
    setLoadingTx(true);
    setErrorTx('');
    supabase.rpc('get_owner_transactions', { start_date: startDate, end_date: endDate })
      .then(({ data, error }) => {
        if (error) throw error;
        setTxs(data);
      })
      .catch(e => setErrorTx('Chyba při načítání transakcí: ' + e.message))
      .finally(() => setLoadingTx(false));
  }, [startDate, endDate]);

  // 3) Aplikace typového filtru
  const filteredTx = txs.filter(tx => selectedTypes.includes(tx.type));

  return (
    <div style={{ padding: '1rem' }}>
      {/* -- OPRAVA #1: Jen jediné tlačítko zpět */}
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        ← Zpět do menu
      </button>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Přehled a Statistiky
      </h2>

      {/* -- Filtry */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'center'
      }}>
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
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Typ transakce:
          <select
            multiple
            size={2}
            value={selectedTypes}
            onChange={e =>
              setSelectedTypes(Array.from(
                e.target.selectedOptions,
                o => o.value
              ))
            }
            style={{ minWidth: '180px', marginTop: '0.25rem' }}
          >
            <option value="topup">Nabití permanentky</option>
            <option value="usage">Použití permanentky</option>
          </select>
        </label>
      </div>

      {/* -- Statistiky */}
      {errorStats && <div style={{ color: 'red', marginBottom: '1rem' }}>{errorStats}</div>}
      {loadingStats
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
