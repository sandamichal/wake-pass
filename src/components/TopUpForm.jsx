// src/components/TopUpForm.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { QRCodeSVG } from 'qrcode.react'

export default function TopUpForm() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [customer, setCustomer] = useState(null)
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [iban, setIban] = useState('')

  // 1) Načíst produkty a IBAN
  useEffect(() => {
    (async () => {
      let { data: prods } = await supabase.rpc('get_active_products', { product_category: 'permanentka' })
      setProducts(prods || [])
      let { data: setting } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'bank_account_number')
        .single()
      if (setting) setIban(setting.setting_value)
    })()
  }, [])

  // 2) Vyhledání zákazníka
  const doSearch = async () => {
    setLoading(true); setMessage('')
    let { data, error } = await supabase.rpc('search_customers', { search_term: searchQuery })
    if (error) setMessage(error.message)
    else setResults(data || [])
    setLoading(false)
  }

  // 3) Provést top-up
  const doTopUp = async () => {
    if (!customer || !productId) {
      setMessage('Vyberte zákazníka i produkt.')
      return
    }
    setLoading(true); setMessage('')
    let { error, data } = await supabase.rpc('top_up_pass', {
      customer_id: customer.id,
      product_id_to_add: productId,
      payment_method: paymentMethod,
    })
    if (error) setMessage(error.message)
    else setMessage(data.message || 'Hotovo.')
    setLoading(false)
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Nabít permanentku</h2>

      <input
        type="text"
        placeholder="Hledat jméno/e-mail…"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <button onClick={doSearch} disabled={loading}>
        Hledat
      </button>

      {results.map(u => (
        <div
          key={u.id}
          onClick={() => { setCustomer(u); setMessage('') }}
          style={{
            cursor: 'pointer',
            background: customer?.id === u.id ? '#dbeafe' : 'transparent',
          }}
        >
          {u.full_name} ({u.email})
        </div>
      ))}

      {customer && (
        <>
          <div>
            <label>Balíček:</label>
            <select value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">– vyberte –</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.price_czk} Kč)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Metoda platby:</label>
            <label>
              <input
                type="radio"
                name="pay"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />{' '}
              Hotově
            </label>
            <label>
              <input
                type="radio"
                name="pay"
                value="qr_code"
                checked={paymentMethod === 'qr_code'}
                onChange={() => setPaymentMethod('qr_code')}
              />{' '}
              QR kód
            </label>
          </div>

          {paymentMethod === 'qr_code' && (
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <QRCodeSVG
                value={`SPD*1.0*ACC:${iban}*AM:${
                  products.find(p => p.id === productId).price_czk
                }*MSG:Dobiti`}
                size={180}
              />
            </div>
          )}

          <button onClick={doTopUp} disabled={loading}>
            {loading ? 'Čekejte…' : 'Potvrdit nabití'}
          </button>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  )
}
