// src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StatCard = ({ title, value, unit, color }) => {
  return (
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
};

const Statistics = () => {
  // dnešní datum ve formátu YYYY-MM-DD pro <input type="date">
  const today = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]   = useState(today);
  const [types, setTypes]       = useState(['topup','usage']);

  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // načíst statistiky kdykoliv se změní filtry
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: rpcError } = await supabase
          .rpc('get_owner_stats', {
            _end_date:   endDate,
            _start_date: startDate,
            _types:      types
          });
        if (rpcError) throw rpcError;
        // rpc vrací pole řádků, ale my víme, že je jen jeden
        setStats(data[0]);
      } catch (err) {
        console.error(err);
        setError('Nepodařilo se načíst statistiky: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate, types]);

  const toggleType = (type) => {
    setTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Přehled a Statistiky
      </h2>

      {/* Filtry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
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
        <fieldset style={{ border: '1px solid #ddd', padding: '0.5rem' }}>
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

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

      {!stats && loading && <p style={{ marginTop: '1rem' }}>Načítám...</p>}

      {stats && (
        <>
          {/* Čtyři karty se statistikami */}
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
        </>
      )}
    </div>
  );
};

export default Statistics;
