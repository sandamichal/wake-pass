// src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const StatCard = ({ title, value, unit }) => (
  <div style={{
    background: 'white', padding: '1.5rem',
    borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
      {value} <span style={{ fontSize: '1.5rem' }}>{unit || ''}</span>
    </div>
    <div style={{ fontSize: '1rem', color: '#6b7280' }}>{title}</div>
  </div>
)

const Statistics = ({ onBack }) => {
  const [stats, setStats]   = useState({ total_customers: 0, total_operators: 0 })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.rpc('get_owner_stats')
        if (error) throw error
        setStats(data)
      } catch (err) {
        setError('Nepodařilo se načíst přehled: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      {/* back-button vykresluje rodič (OwnerDashboard), zde ho necháme pryč */}

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Přehled a Statistiky
      </h2>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard title="Celkem zákazníků" value={stats.total_customers} />
        <StatCard title="Celkem operátorů" value={stats.total_operators} />
      </div>

      {/* sem později doplníte výběr datumu a tabulku transakcí */}
    </div>
  )
}

export default Statistics
