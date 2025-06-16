// soubor: src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StatCard = ({ title, value, unit }) => {
  const cardStyle = {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'center',
  };
  const valueStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#3b82f6',
  };
  const titleStyle = {
    fontSize: '1rem',
    color: '#6b7280',
  };

  return (
    <div style={cardStyle}>
      <div style={valueStyle}>{value} <span style={{fontSize: '1.5rem'}}>{unit}</span></div>
      <div style={titleStyle}>{title}</div>
    </div>
  );
};


const Statistics = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: rpcError } = await supabase.rpc('get_owner_stats');
        if (rpcError) throw rpcError;
        setStats(data);
      } catch (err) {
        setError('Nepodařilo se načíst statistiky: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div>Načítám statistiky...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        &larr; Zpět do menu
      </button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Přehled a Statistiky</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard title="Celkem Zákazníků" value={stats.total_customers} />
        <StatCard title="Celkem Operátorů" value={stats.total_operators} />
        <StatCard title="Prodaných Hodin" value={Number(stats.total_hours_sold).toLocaleString('cs-CZ')} unit="hod" />
        <StatCard title="Použitých Hodin" value={Number(stats.total_hours_used).toLocaleString('cs-CZ')} unit="hod" />
      </div>
    </div>
  );
};

export default Statistics;
