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

const TYPE_OPTIONS = [
  { value: 'topup', label: 'Nabití permanentky' },
  { value: 'usage', label: 'Použití permanentky' },
];

const Statistics = ({ onBack }) => {
  // 1) Výchozí dnešní datum
  const today = new Date().toISOString().slice(0,10);
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState(today);

  // 2) Vícevýběr typu transakcí
  const [typeFilter, setTypeFilter] = useState(TYPE_OPTIONS.map(o=>o.value));

  // 3) Data a stav
  const [stats, setStats]             = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // Načtení statistik
  const fetchStats = async () => {
    const { data, error: rpcError } = await supabase
      .rpc('get_owner_stats', { _start_date: startDate, _end_date: endDate });
    if (rpcError) throw rpcError;
    setStats(data);
  };

  // Načtení transakcí
  const fetchTransactions = async () => {
    const params = {
      _start_date: startDate,
      _end_date:   endDate,
      _types:      typeFilter.length === 2 ? null : typeFilter
    };
    const { data, error: rpcError } = await supabase
      .rpc('get_owner_transactions', params);
    if (rpcError) throw rpcError;
    setTransactions(data);
  };

  // Kdykoliv se změní filtr, data, načti znovu
  useEffect(() => {
    setError('');
    setLoading(true);
    Promise.all([ fetchStats(), fetchTransactions() ])
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [startDate, endDate, typeFilter]);

  if (loading) return <div>Načítám…</div>;
  if (error)   return <div style={{ color: 'red' }}>{error}</div>;
  if (!stats)  return null;

  // Formát datumu + času
  const fmtDateTime = dt => {
    const d = new Date(dt);
    const date = d.toLocaleDateString('cs-CZ', { day:'2-digit',month:'2-digit',year:'numeric' });
    const time = d.toLocaleTimeString('cs-CZ', { hour:'2-digit',minute:'2-digit' });
    return `${date} ${time}`;
  };

  // Změna typu ve vícenásobném selectu
  const handleTypeChange = e => {
    setTypeFilter(Array.from(e.target.selectedOptions).map(o=>o.value));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        ← Zpět do menu
      </button>
      <h2 style={{ marginBottom: '1rem' }}>Přehled a Statistiky</h2>

      {/* Filtry */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label>
          Od: <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/> 
        </label>
        <label>
          Do: <input type="date" value={endDate}   onChange={e=>setEndDate(e.target.value)}/>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column' }}>
          Typ transakce:
          <select 
            multiple size={2} 
            value={typeFilter} 
            onChange={handleTypeChange}
            style={{ marginTop: '0.25rem' }}
          >
            {TYPE_OPTIONS.map(o=>(
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Statistické karty */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard title="Celkem zákazníků" value={stats.total_customers}/>
        <StatCard title="Celkem operátorů" value={stats.total_operators}/>
        <StatCard title="Prodáno hodin"   value={stats.sold_hours} unit="hod"/>
        <StatCard title="Použito hodin"   value={stats.used_hours} unit="hod"/>
      </div>

      {/* Tabulka transakcí */}
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ borderBottom:'2px solid #ccc' }}>
            <th style={{ textAlign:'left', padding:'0.5rem' }}>Čas</th>
            <th style={{ textAlign:'left', padding:'0.5rem' }}>Typ</th>
            <th style={{ textAlign:'right', padding:'0.5rem' }}>Hodiny</th>
            <th style={{ textAlign:'left', padding:'0.5rem' }}>Uživatel</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding:'1rem', textAlign:'center', color:'#666' }}>
                Žádné transakce pro zvolený filtr.
              </td>
            </tr>
          )}
          {transactions.map(tx => {
            const isTopup = tx.type === 'topup';
            const label   = isTopup ? 'Nabití permanentky' : 'Použití permanentky';
            const amt     = isTopup ? `+${tx.amount}` : `${Math.abs(tx.amount)}`;
            return (
              <tr key={tx.id} style={{ borderBottom:'1px solid #eee' }}>
                <td style={{ padding:'0.5rem' }}>{fmtDateTime(tx.created_at)}</td>
                <td style={{ padding:'0.5rem' }}>{label}</td>
                <td style={{
                  padding:'0.5rem',
                  textAlign:'right',
                  color: isTopup ? 'green' : 'red',
                  fontWeight:'bold'
                }}>
                  {amt}
                </td>
                <td style={{ padding:'0.5rem' }}>{tx.full_name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Statistics;
