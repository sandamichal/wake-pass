import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { supabase } from '../supabaseClient';

// Jednotné styly
const cardStyle = {
  background: 'white',
  padding: '1rem',
  borderRadius: '0.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  textAlign: 'center'
};
const valueStyle = { fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' };
const titleStyle = { fontSize: '0.9rem', color: '#6b7280', marginTop: '0.25rem' };
const thStyle    = { borderBottom: '1px solid #ddd', padding: '0.5rem', textAlign: 'left' };
const tdStyle    = { borderBottom: '1px solid #eee', padding: '0.5rem' };
const errStyle   = { color: 'red', marginTop: '0.5rem' };

// Komponenta pro každou kartu
function StatCard({ label, value, error }) {
  return (
    <div style={cardStyle}>
      <div style={valueStyle}>{value}</div>
      <div style={titleStyle}>{label}</div>
      {error && <div style={errStyle}>{error}</div>}
    </div>
  );
}

function Statistics() {
  // Výchozí dnešní datum (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);

  // Stavy filtru
  const [from, setFrom]   = useState(today);
  const [to,   setTo]     = useState(today);
  const [types, setTypes] = useState([]); // ['topup','usage']

  // Stavy dat + načítání + chyby
  const [stats, setStats]           = useState(null);
  const [txs, setTxs]               = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTxs, setLoadingTxs]     = useState(false);
  const [errorStats, setErrorStats]     = useState('');
  const [errorTxs, setErrorTxs]         = useState('');

  // Debounced načítání statistik
  const fetchStats = useCallback(
    debounce(async (f, t) => {
      setLoadingStats(true);
      setErrorStats('');
      try {
        const { data, error } = await supabase
          .rpc('get_owner_stats', { _start_date: f, _end_date: t });
        if (error) throw error;
        setStats(data[0] || {});
      } catch (err) {
        setErrorStats(err.message);
      } finally {
        setLoadingStats(false);
      }
    }, 300),
    []
  );

  // Debounced načítání transakcí
  const fetchTxs = useCallback(
    debounce(async (f, t, ty) => {
      setLoadingTxs(true);
      setErrorTxs('');
      try {
        const { data, error } = await supabase
          .rpc('get_owner_transactions', {
            _start_date: f,
            _end_date:   t,
            _types:      ty.length ? ty : null
          });
        if (error) throw error;
        setTxs(data || []);
      } catch (err) {
        setErrorTxs(err.message);
      } finally {
        setLoadingTxs(false);
      }
    }, 300),
    []
  );

  // Při změně filtru načítáme znovu
  useEffect(() => {
    fetchStats(from, to);
    fetchTxs(from, to, types);
  }, [from, to, types, fetchStats, fetchTxs]);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Přehled a Statistiky</h2>

      {/* Filtr */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          Od:
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
        <label>
          Do:
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
        <label>
          Typ transakce:
          <select
            multiple
            value={types}
            onChange={e => {
              const vals = Array.from(e.target.selectedOptions).map(o => o.value);
              setTypes(vals);
            }}
            style={{ marginLeft: '0.5rem', minWidth: '160px', height: '4.5rem' }}
          >
            <option value="topup">Nabití permanentky</option>
            <option value="usage">Použití permanentky</option>
          </select>
        </label>
      </div>

      {/* Statistické karty */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        <StatCard
          label="Celkem zákazníků"
          value={loadingStats ? '…' : stats?.total_customers ?? 0}
          error={errorStats}
        />
        <StatCard
          label="Celkem operátorů"
          value={loadingStats ? '…' : stats?.total_operators ?? 0}
          error={errorStats}
        />
        <StatCard
          label="Prodáno hodin"
          value={loadingStats ? '…' : `${stats?.sold_hours ?? 0} hod`}
          error={errorStats}
        />
        <StatCard
          label="Použito hodin"
          value={loadingStats ? '…' : `${stats?.used_hours ?? 0} hod`}
          error={errorStats}
        />
      </div>

      {/* Tabulka transakcí */}
      <h3 style={{ marginTop: '2rem' }}>Seznam transakcí</h3>
      {loadingTxs && <p>Načítám transakce…</p>}
      {errorTxs && <p style={{ color: 'red' }}>Chyba: {errorTxs}</p>}
      {!loadingTxs && !errorTxs && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              <th style={thStyle}>Čas</th>
              <th style={thStyle}>Typ</th>
              <th style={thStyle}>Hodiny</th>
              <th style={thStyle}>Uživatel</th>
            </tr>
          </thead>
          <tbody>
            {txs.map(t => (
              <tr key={t.id}>
                <td style={tdStyle}>
                  {new Date(t.created_at).toLocaleString('cs-CZ', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td style={tdStyle}>
                  {t.type === 'topup' ? 'Nabití permanentky' : 'Použití permanentky'}
                </td>
                <td style={{
                  ...tdStyle,
                  color:  t.type === 'usage' ? 'red' : 'green',
                  fontWeight: 'bold'
                }}>
                  {t.type === 'usage' ? `-${Math.abs(t.amount)}` : `+${t.amount}`}
                </td>
                <td style={tdStyle}>{t.full_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Statistics;
