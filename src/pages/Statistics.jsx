// src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Jedna kartička se statistikou
const StatCard = ({ title, value, unit }) => {
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#3b82f6',
      }}>
        {value} {unit && <span style={{ fontSize: '1.5rem' }}>{unit}</span>}
      </div>
      <div style={{ fontSize: '1rem', color: '#6b7280' }}>
        {title}
      </div>
    </div>
  );
};

const Statistics = ({ onBack }) => {
  // 1) Celkové počty
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalOperators, setTotalOperators] = useState(0);

  // 2) Date pickery
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0,10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0,10));

  // 3) Statistika za období
  const [soldHours, setSoldHours] = useState(0);
  const [usedHours, setUsedHours] = useState(0);

  // 4) Filtr transakcí
  const [typeFilter, setTypeFilter] = useState('all'); // all | topup | usage | rental | one-time

  // 5) Seznam transakcí
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Načtení celkových počtů zákazníků a operátorů
  const fetchTotals = async () => {
    const { data, error: rpcError } = await supabase.rpc('get_owner_stats');
    if (rpcError) throw rpcError;
    const row = Array.isArray(data) ? data[0] : data;
    setTotalCustomers(row.total_customers ?? 0);
    setTotalOperators(row.total_operators ?? 0);
  };

  // Načtení hodin za vybrané období
  const fetchPeriodStats = async () => {
    const { data, error: rpcError } = await supabase
      .rpc('get_stats_by_period', { start_date: fromDate, end_date: toDate });
    if (rpcError) throw rpcError;
    const row = Array.isArray(data) ? data[0] : data;
    setSoldHours(row.sold_hours ?? 0);
    setUsedHours(row.used_hours ?? 0);
  };

  // Načtení transakcí za období a dle filtru
  const fetchTransactions = async () => {
    const { data, error: rpcError } = await supabase
      .rpc('get_owner_transactions', {
        start_date: fromDate,
        end_date: toDate,
        type_filter: typeFilter
      });
    if (rpcError) throw rpcError;
    setTransactions(data || []);
  };

  // Společné načtení
  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      await fetchTotals();
      await fetchPeriodStats();
      await fetchTransactions();
    } catch (err) {
      setError('Chyba při načítání: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Načteme vše jednou při mountu a znovu při změně filtrů/dat
  useEffect(() => {
    loadAll();
  }, [fromDate, toDate, typeFilter]);

  if (loading) {
    return <div>Načítám data…</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        &larr; Zpět do menu
      </button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Přehled a Statistiky</h2>

      {/* 1) Celkové počty */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        margin: '1.5rem 0'
      }}>
        <StatCard title="Zákazníků celkem" value={totalCustomers} />
        <StatCard title="Operátorů celkem" value={totalOperators} />
      </div>

      {/* 2) Výběr období */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label>
          Od:{' '}
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </label>{' '}
        <label>
          Do:{' '}
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </label>
      </div>

      {/* 3) Hodiny za období */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <StatCard
          title="Prodané hodiny"
          value={Number(soldHours).toLocaleString('cs-CZ')}
          unit="hod"
        />
        <StatCard
          title="Použité hodiny"
          value={Number(usedHours).toLocaleString('cs-CZ')}
          unit="hod"
        />
      </div>

      {/* 4) Filtr transakcí */}
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Zobrazit:{' '}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">Všechny transakce</option>
            <option value="topup">Nabití permanentky</option>
            <option value="usage">Použití permanentky</option>
            <option value="rental">Pronájmy</option>
            <option value="one-time">Jednorázové použití</option>
          </select>
        </label>
      </div>

      {/* 5) Tabulka transakcí */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Datum</th>
              <th style={{ padding: '0.5rem' }}>Typ</th>
              <th style={{ padding: '0.5rem' }}>Hodiny</th>
              <th style={{ padding: '0.5rem' }}>Uživatel</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.5rem' }}>
                  {new Date(tx.created_at).toLocaleString('cs-CZ')}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {tx.type === 'topup' ? 'Nabití' :
                   tx.type === 'usage' ? 'Použití' :
                   tx.type === 'rental' ? 'Pronájem' :
                   'Jiný'}
                </td>
                <td style={{ padding: '0.5rem' }}>{tx.amount}</td>
                <td style={{ padding: '0.5rem' }}>{tx.full_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statistics;
