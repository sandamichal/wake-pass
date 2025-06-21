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
      {value}{unit && ` ${unit}`}
    </div>
    <div style={{ fontSize: '1rem', color: '#6b7280' }}>{title}</div>
  </div>
);

const Statistics = ({ onBack }) => {
  // rozsah dat
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');

  // data
  const [summary, setSummary] = useState({ total_customers: 0, total_operators: 0 });
  const [hours,   setHours]   = useState({ sold_hours: 0, used_hours: 0 });
  const [txList,  setTxList]  = useState([]);

  const [loading, setLoading] = useState({
    summary: true,
    hours:   false,
    tx:      false,
  });
  const [error,   setError]   = useState('');

  // 1) Načíst souhrn hned po mountu
  useEffect(() => {
    const loadSummary = async () => {
      setLoading(l => ({ ...l, summary: true }));
      try {
        const { data, error } = await supabase.rpc('get_owner_stats');
        if (error) throw error;
        setSummary(data[0]);
      } catch (err) {
        setError('Nepodařilo se načíst přehled: ' + err.message);
      } finally {
        setLoading(l => ({ ...l, summary: false }));
      }
    };
    loadSummary();
  }, []);

  // 2) Když uživatel zadá obě data, načti hodiny i transakce
  useEffect(() => {
    if (!from || !to) return;

    const p_start = new Date(from).toISOString();
    const p_end   = new Date(to).toISOString();

    const loadHours = async () => {
      setLoading(l => ({ ...l, hours: true }));
      try {
        const { data, error } = await supabase.rpc('get_hours_stats', { p_start, p_end });
        if (error) throw error;
        setHours(data[0]);
      } catch (err) {
        setError('Nepodařilo se načíst souhrn hodin: ' + err.message);
      } finally {
        setLoading(l => ({ ...l, hours: false }));
      }
    };

    const loadTx = async () => {
      setLoading(l => ({ ...l, tx: true }));
      try {
        const { data, error } = await supabase.rpc('get_transactions_period', { p_start, p_end });
        if (error) throw error;
        setTxList(data);
      } catch (err) {
        setError('Nepodařilo se načíst transakce: ' + err.message);
      } finally {
        setLoading(l => ({ ...l, tx: false }));
      }
    };

    loadHours();
    loadTx();
  }, [from, to]);

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Zpět do menu</button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Přehled a Statistiky</h2>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {/* 1) Souhrn */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard 
          title="Celkem zákazníků" 
          value={loading.summary ? '…' : summary.total_customers} 
        />
        <StatCard 
          title="Celkem operátorů" 
          value={loading.summary ? '…' : summary.total_operators} 
        />
      </div>

      {/* 2) Výběr období */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
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
      </div>

      {/* 3) Souhrn hodin */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard 
          title="Prodáno hodin" 
          value={loading.hours ? '…' : hours.sold_hours} 
          unit="hod" 
        />
        <StatCard 
          title="Použito hodin" 
          value={loading.hours ? '…' : hours.used_hours} 
          unit="hod" 
        />
      </div>

      {/* 4) Tabulka transakcí */}
      <h3 style={{ marginBottom: '0.5rem' }}>Seznam transakcí</h3>
      {loading.tx 
        ? <p>Načítám transakce…</p>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Čas</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Typ</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Hodiny</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Uživatel</th>
              </tr>
            </thead>
            <tbody>
              {txList.map(tx => (
                <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>
                    {new Date(tx.transacted_at).toLocaleString('cs-CZ')}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{tx.type === 'topup' ? 'Nabití' : 'Použití'}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                    {tx.type === 'usage' ? -tx.hours : tx.hours}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{tx.user_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  );
};

export default Statistics;
