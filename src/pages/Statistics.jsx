import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { supabase } from '../supabaseClient';

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
  const today = new Date().toISOString().slice(0,10);
  const [from,   setFrom]   = useState(today);
  const [to,     setTo]     = useState(today);
  const [types,  setTypes]  = useState([]); // ['topup','usage']
  const [stats,  setStats]  = useState({});
  const [txs,    setTxs]    = useState([]);
  const [lStat,  setLStat]  = useState(false);
  const [lTx,    setLTx]    = useState(false);
  const [eStat,  setEStat]  = useState('');
  const [eTx,    setETx]    = useState('');

  const fetchStats = useCallback(
    debounce(async (f,t) => {
      setLStat(true); setEStat('');
      const { data, error } = await supabase.rpc('get_owner_stats', { _start_date: f, _end_date: t });
      if (error) { setEStat(error.message) }
      else      { setStats(data[0] || {}) }
      setLStat(false);
    }, 300),
    []
  );

  const fetchTxs = useCallback(
    debounce(async (f,t,ty) => {
      setLTx(true); setETx('');
      const { data, error } = await supabase.rpc('get_owner_transactions', {
        _start_date: f,
        _end_date:   t,
        _types:      ty.length ? ty : null
      });
      if (error) { setETx(error.message) }
      else       { setTxs(data || []) }
      setLTx(false);
    }, 300),
    []
  );

  useEffect(() => {
    fetchStats(from, to);
    fetchTxs(from, to, types);
  }, [from, to, types, fetchStats, fetchTxs]);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Přehled a Statistiky</h2>

      {/* filtr */}
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <label>Od:
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{marginLeft:'0.5rem'}}/>
        </label>
        <label>Do:
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{marginLeft:'0.5rem'}}/>
        </label>
        <label>Typ transakce:
          <select
            multiple
            value={types}
            onChange={e => {
              const s = Array.from(e.target.selectedOptions).map(o=>o.value);
              setTypes(s);
            }}
            style={{ marginLeft:'0.5rem', minWidth:'160px', height:'4.5rem' }}
          >
            <option value="topup">Nabití permanentky</option>
            <option value="usage">Použití permanentky</option>
          </select>
        </label>
      </div>

      {/* karty */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
        gap:'1rem',
        marginTop:'1.5rem'
      }}>
        <StatCard
          label="Celkem zákazníků"
          value={lStat ? '…' : stats.total_customers ?? 0}
          error={eStat}
        />
        <StatCard
          label="Celkem operátorů"
          value={lStat ? '…' : stats.total_operators ?? 0}
          error={eStat}
        />
        <StatCard
          label="Prodáno hodin"
          value={lStat ? '…' : `${stats.sold_hours ?? 0} hod`}
          error={eStat}
        />
        <StatCard
          label="Použito hodin"
          value={lStat ? '…' : `${stats.used_hours ?? 0} hod`}
          error={eStat}
        />
      </div>

      {/* tabulka */}
      <h3 style={{ marginTop:'2rem' }}>Seznam transakcí</h3>
      {lTx && <p>Načítám transakce…</p>}
      {eTx && <p style={{color:'red'}}>Chyba: {eTx}</p>}
      {!lTx && !eTx && (
        <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'1rem' }}>
          <thead>
            <tr>
              <th style={thStyle}>Čas</th>
              <th style={thStyle}>Typ</th>
              <th style={thStyle}>Hodiny</th>
              <th style={thStyle}>Uživatel</th>
            </tr>
          </thead>
          <tbody>
            {txs.map(t=>(
              <tr key={t.id}>
                <td style={tdStyle}>
                  {new Date(t.created_at).toLocaleString('cs-CZ',{
                    day:'2-digit',month:'2-digit',year:'numeric',
                    hour:'2-digit',minute:'2-digit'
                  })}
                </td>
                <td style={tdStyle}>
                  {t.type==='topup'
                    ? 'Nabití permanentky'
                    : 'Použití permanentky'}
                </td>
                <td style={{
                  ...tdStyle,
                  color:  t.type==='usage' ? 'red' : 'green',
                  fontWeight:'bold'
                }}>
                  {t.type==='usage'
                    ? `-${Math.abs(t.amount)}`
                    : `+${t.amount}`}
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
