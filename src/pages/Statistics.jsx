// src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StatCard = ({ title, value, unit, color }) => (
  <div style={{
    background: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'center'
  }}>
    <div style={{
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: color || '#3b82f6',
      marginBottom: '0.25rem'
    }}>
      {value} {unit}
    </div>
    <div style={{ fontSize: '1rem', color: '#6b7280' }}>
      {title}
    </div>
  </div>
);

const Statistics = () => {
  // default today in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate]       = useState(today);
  const [endDate, setEndDate]           = useState(today);
  const [types, setTypes]               = useState(['topup', 'usage']);

  const [stats, setStats]               = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // fetch stats + transactions whenever filters change
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        // 1) statistics RPC
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_owner_stats', {
            _end_date:   endDate,
            _start_date: startDate,
            _types:      types
          });
        if (statsError) throw statsError;
        // pick first row
        setStats(statsData[0] || { total_customers: 0, total_operators: 0, total_hours_sold: 0, total_hours_used: 0 });

        // 2) transactions RPC
        const { data: txData, error: txError } = await supabase
          .rpc('get_owner_transactions', {
            _end_date:   endDate,
            _start_date: startDate,
            _types:      types
          });
        if (txError) throw txError;
        setTransactions(txData || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [startDate, endDate, types]);

  const toggleType = (type) => {
    setTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('cs-CZ', {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
      hour:  '2-digit',
      minute:'2-digit'
    });

  const renderAmount = (type, amount) => {
    const val = type === 'topup'
      ? `+${amount}`
      : `-${Math.abs(amount)}`;
    return (
      <span style={{ color: type === 'topup' ? 'green' : 'red', fontWeight: 'bold' }}>
        {val}
      </span>
    );
  };

  const renderTypeName = (type) =>
    type === 'topup'
      ? 'Nabití permanentky'
      : 'Použití permanentky';

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Přehled a Statistiky
      </h2>

      {/* Filtry */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <label>
          Od:{' '}
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Do:{' '}
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </label>
        <fieldset style={{
          border: '1px solid #ddd',
          padding: '0.5rem'
        }}>
          <legend style={{ fontWeight: '600' }}>Typ transakce:</legend>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={types.includes('topup')}
              onChange={() => toggleType('topup')}
            />{' '}
            Nabití permanentky
          </label>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={types.includes('usage')}
              onChange={() => toggleType('usage')}
            />{' '}
            Použití permanentky
          </label>
        </fieldset>
      </div>

      {error && (
        <p style={{ color: 'red', marginTop: '1rem' }}>
          Nepodařilo se načíst: {error}
        </p>
      )}

      {loading && !stats && (
        <p style={{ marginTop: '1rem' }}>Načítám...</p>
      )}

      {stats && (
        <>
          {/* Statistiky */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <StatCard
              title="Celkem zákazníků"
              value={stats.total_customers}
              unit=""
            />
            <StatCard
              title="Celkem operátorů"
              value={stats.total_operators}
              unit=""
            />
            <StatCard
              title="Prodáno hodin"
              value={`+${stats.total_hours_sold}`}
              unit="hod"
              color="green"
            />
            <StatCard
              title="Použito hodin"
              value={`–${stats.total_hours_used}`}
              unit="hod"
              color="red"
            />
          </div>

          {/* Tabulka transakcí */}
          <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc' }}>
                  <th style={{ padding: '0.5rem' }}>Čas</th>
                  <th style={{ padding: '0.5rem' }}>Typ</th>
                  <th style={{ padding: '0.5rem' }}>Hodiny</th>
                  <th style={{ padding: '0.5rem' }}>Uživatel</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem' }}>{formatDate(tx.created_at)}</td>
                    <td style={{ padding: '0.5rem' }}>{renderTypeName(tx.type)}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {renderAmount(tx.type, tx.amount)}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{tx.full_name}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                      Žádné transakce pro zvolený filtr.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;
