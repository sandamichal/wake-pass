// src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const Statistics = ({ onBack }) => {
  // Dnešní datum pro výchozí hodnotu
  const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"

  // Stav filtrů
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [types, setTypes] = useState(['topup', 'usage']) // obojí defaultně

  // Stav dat
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOperators: 0,
    totalHoursSold: 0,
    totalHoursUsed: 0,
  })
  const [transactions, setTransactions] = useState([])

  // Načítací + chybové stavy
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingTx, setLoadingTx] = useState(false)
  const [error, setError] = useState('')

  // --- 1) Načíst statistiky přes RPC ---
  const fetchStats = async () => {
    setLoadingStats(true)
    setError('')
    try {
      const { data, error: rpcErr } = await supabase
        .rpc('get_owner_stats', {
          _start_date: startDate,
          _end_date: endDate,
          _types: types,
        })
      if (rpcErr) throw rpcErr

      setStats({
        totalCustomers: data.total_customers,
        totalOperators: data.total_operators,
        totalHoursSold: data.total_hours_sold,
        totalHoursUsed: data.total_hours_used,
      })
    } catch (err) {
      setError('Nepodařilo se načíst statistiky: ' + err.message)
    } finally {
      setLoadingStats(false)
    }
  }

  // --- 2) Načíst transakce s JOIN na passes → users ---
  const fetchTransactions = async () => {
    setLoadingTx(true)
    setError('')
    try {
      let query = supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          created_at,
          passes!inner(
            id,
            user_id,
            users!inner(
              full_name
            )
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      // Pokud nejsou vybrány oba typy, přidáme eq filtr jen na první
      if (!(types.includes('topup') && types.includes('usage'))) {
        query = query.eq('type', types[0])
      }

      const { data, error: selErr } = await query
      if (selErr) throw selErr

      setTransactions(data)
    } catch (err) {
      setError('Nepodařilo se načíst transakce: ' + err.message)
    } finally {
      setLoadingTx(false)
    }
  }

  // Pokaždé, když se změní datum nebo typy, znovu načti
  useEffect(() => {
    fetchStats()
    fetchTransactions()
  }, [startDate, endDate, types])

  // Pomocná funkce pro změnu checkbox‐selectu
  const handleTypeChange = (e) => {
    const { value, checked } = e.target
    setTypes((prev) =>
      checked ? [...prev, value] : prev.filter((t) => t !== value)
    )
  }

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        ← Zpět do menu
      </button>

      <h2>Přehled a Statistiky</h2>

      {/* Filtry */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <label>
          Od:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Do:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <fieldset style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
          <legend>Typ transakcí</legend>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              value="topup"
              checked={types.includes('topup')}
              onChange={handleTypeChange}
            />{' '}
            Nabití permanentky
          </label>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              value="usage"
              checked={types.includes('usage')}
              onChange={handleTypeChange}
            />{' '}
            Použití permanentky
          </label>
        </fieldset>
      </div>

      {/* Chyba */}
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
      )}

      {/* Statistiky karty */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          {loadingStats ? '…' : stats.totalCustomers}
          <div>Celkem zákazníků</div>
        </div>
        <div
          style={{
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          {loadingStats ? '…' : stats.totalOperators}
          <div>Celkem operátorů</div>
        </div>
        <div
          style={{
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          {loadingStats ? '…' : `${stats.totalHoursSold} hod`}
          <div>Prodáno hodin</div>
        </div>
        <div
          style={{
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          {loadingStats ? '…' : `${stats.totalHoursUsed} hod`}
          <div>Použito hodin</div>
        </div>
      </div>

      {/* Tabulka transakcí */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem' }}>
              Čas
            </th>
            <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem' }}>
              Typ
            </th>
            <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem' }}>
              Hodiny
            </th>
            <th style={{ borderBottom: '1px solid #ccc', padding: '0.5rem' }}>
              Uživatel
            </th>
          </tr>
        </thead>
        <tbody>
          {loadingTx ? (
            <tr>
              <td colSpan={4} style={{ padding: '1rem' }}>
                Načítám transakce…
              </td>
            </tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ padding: '0.5rem' }}>
                  {new Date(tx.created_at).toLocaleString('cs-CZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {tx.type === 'topup'
                    ? 'Nabití permanentky'
                    : 'Použití permanentky'}
                </td>
                <td
                  style={{
                    padding: '0.5rem',
                    color: tx.type === 'topup' ? 'green' : 'red',
                    fontWeight: 'bold',
                  }}
                >
                  {tx.type === 'topup'
                    ? `+${tx.amount}`
                    : `-${Math.abs(tx.amount)}`}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {tx.passes.users.full_name}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Statistics
