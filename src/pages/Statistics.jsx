// soubor: src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const Statistics = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ownerStats, setOwnerStats] = useState({ total_customers: 0, total_operators: 0 })
  const [periodStats, setPeriodStats] = useState({ sold_hours: 0, used_hours: 0 })
  const [transactions, setTransactions] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // 1) Načtení celkových čísel (zákazníci, operátoři)
  useEffect(() => {
    const loadOwnerStats = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.rpc('get_owner_stats')
        if (error) throw error
        setOwnerStats(data)
      } catch (err) {
        setError('Nepodařilo se načíst přehled: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    loadOwnerStats()
  }, [])

  // 2) Při změně data spustit načtení agregátů
  useEffect(() => {
    if (dateFrom && dateTo) {
      loadPeriodStats()
      loadTransactions()
    }
  }, [dateFrom, dateTo, typeFilter])

  const loadPeriodStats = async () => {
    try {
      setError('')
      setLoading(true)
      // převedeme datumy na ISO se zachováním časové zóny
      const _start = new Date(dateFrom + 'T00:00:00Z').toISOString()
      const _end   = new Date(dateTo   + 'T23:59:59Z').toISOString()
      const { data, error } = await supabase
        .rpc('get_stats_by_period', { _start, _end })
      if (error) throw error
      setPeriodStats(data)
    } catch (err) {
      setError('Nepodařilo se načíst statistiky pro vybrané období: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      setError('')
      setLoading(true)
      const _start = new Date(dateFrom + 'T00:00:00Z').toISOString()
      const _end   = new Date(dateTo   + 'T23:59:59Z').toISOString()
      const { data, error } = await supabase
        .rpc('get_transactions_by_period', { _start, _end, type_filter: typeFilter })
      if (error) throw error
      setTransactions(data)
    } catch (err) {
      setError('Nepodařilo se načíst transakce: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={() => window.history.back()} style={{ marginBottom: '1rem' }}>
        &larr; Zpět do menu
      </button>
      <h2 style={{ marginBottom: '1rem' }}>Přehled a Statistiky</h2>

      {loading && !error && <p>Načítám…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* 1) Celková čísla */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, padding: '1rem', background: 'white', borderRadius: '0.5rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ownerStats.total_customers}</div>
          <div>Celkem zákazníků</div>
        </div>
        <div style={{ flex: 1, padding: '1rem', background: 'white', borderRadius: '0.5rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{ownerStats.total_operators}</div>
          <div>Celkem operátorů</div>
        </div>
      </div>

      {/* 2) Výběr období */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          <label>Od:</label><br />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label>Do:</label><br />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* 3) Součty pro vybrané období */}
      {dateFrom && dateTo && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, padding: '1rem', background: 'white', borderRadius: '0.5rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{periodStats.sold_hours}</div>
            <div>Prodáno hodin</div>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: 'white', borderRadius: '0.5rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{periodStats.used_hours}</div>
            <div>Použito hodin</div>
          </div>
        </div>
      )}

      {/* 4) Filtr pro typ transakcí */}
      {dateFrom && dateTo && (
        <div style={{ marginBottom: '1rem' }}>
          <label>Typ transakcí:</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ marginLeft: '0.5rem' }}>
            <option value="all">Vše</option>
            <option value="topup">Prodané hodiny</option>
            <option value="usage">Použité hodiny</option>
          </select>
        </div>
      )}

      {/* 5) Tabulka transakcí */}
      {dateFrom && dateTo && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Datum</th>
                <th style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Typ</th>
                <th style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Hodiny</th>
                <th style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Uživatel</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>
                    {new Date(tx.created_at).toLocaleString('cs-CZ', {
                      day: 'numeric', month: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>
                    {tx.type === 'topup' ? 'Nabití' : 'Použití'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{Math.abs(tx.amount)}</td>
                  <td style={{ padding: '0.5rem' }}>{tx.user_full_name}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                    Žádné transakce k zobrazení.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Statistics
