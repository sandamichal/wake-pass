// src/pages/Statistics.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const Statistics = ({ onBack }) => {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [types, setTypes] = useState(['topup', 'usage']) // obojí default

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOperators: 0,
    totalHoursSold: 0,
    totalHoursUsed: 0,
  })
  const [transactions, setTransactions] = useState([])

  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingTx, setLoadingTx] = useState(false)
  const [error, setError] = useState('')

  // 1) Načtení statistik z get_owner_stats(start_date, end_date, types_array)
  const fetchStats = async () => {
    setLoadingStats(true)
    setError('')
    try {
      // Pokud jsi rozšířil get_owner_stats o parametr types, jinak zavolej stávající verzi:
      const { data, error: rpcErr } = await supabase
        .rpc('get_owner_stats', { _start_date: startDate, _end_date: endDate, _types: types })
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

  // 2) Načtení transakcí z tabulky transactions podle filtru
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
          pass!inner(id, user_id),
          users!inner(full_name)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      // pokud nejsou vybrány obě typy, přidej eq filtr
      if (!(types.includes('topup') && types.includes('usage'))) {
        query = query.eq('type', types[0])
      }

      const { data, error: selErr } = await query.order('created_at', { ascending: false })
      if (selErr) throw selErr

      setTransactions(data)
    } catch (err) {
      setError('Nepodařilo se načíst transakce: ' + err.message)
    } finally {
      setLoadingTx(false)
    }
  }

  // 3) Pokaždé, když se změní startDate, endDate nebo types, načti znovu vše
  useEffect(() => {
    fetchStats()
    fetchTransactions()
  }, [startDate, endDate, types])

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        ← Zpět do menu
      </button>

      <h2>Přehled a Statistiky</h2>

      {/* Filtry */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
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
        <label>
          Typ transakcí:
          <select
            multiple
            size={2}
            value={types}
            onChange={(e) =>
              setTypes(
                Array.from(e.target.selectedOptions, (opt) =>
                  opt.value === 'Nabití permanentky' ? 'topup' : 'usage'
                )
              )
            }
          >
            <option value="topup">Nabití permanentky</option>
            <option value="usage">Použití permanentky</option>
          </select>
        </label>
      </div>

      {/* Chyba */}
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {/* Statistiky */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px' }}>
          {loadingStats ? 'Načítám…' : stats.totalCustomers}
          <div>Celkem zákazníků</div>
        </div>
        <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px' }}>
          {loadingStats ? 'Načítám…' : stats.totalOperators}
          <div>Celkem operátorů</div>
        </div>
        <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px' }}>
          {loadingStats ? 'Načítám…' : `${stats.totalHoursSold} hod`}
          <div>Prodáno hodin</div>
        </div>
        <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px' }}>
          {loadingStats ? 'Načítám…' : `${stats.totalHoursUsed} hod`}
          <div>Použito hodin</div>
        </div>
      </div>

      {/* Tabulka transakcí */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Čas</th>
            <th>Typ</th>
            <th>Hodiny</th>
            <th>Uživatel</th>
          </tr>
        </thead>
        <tbody>
          {loadingTx ? (
            <tr><td colSpan={4}>Načítám transakce…</td></tr>
          ) : (
            transactions.map((tx) => (
              <tr key={tx.id}>
                <td>{new Date(tx.created_at).toLocaleString('cs-CZ')}</td>
                <td>{tx.type === 'topup' ? 'Nabití permanentky' : 'Použití permanentky'}</td>
                <td style={{ color: tx.type === 'topup' ? 'green' : 'red' }}>
                  {tx.type === 'topup'
                    ? `+${tx.amount}`
                    : `-${Math.abs(tx.amount)}`}
                </td>
                <td>{tx.users.full_name}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Statistics

