import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

const TopUpForm = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [bankAccount, setBankAccount] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentQrString, setPaymentQrString] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Načtení aktivních produktů a čísla účtu
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const { data: prods, error: prodErr } = await supabase.rpc('get_active_products', {
          product_category: 'permanentka',
        });
        if (prodErr) throw prodErr;
        setProducts(prods || []);

        const { data: setting, error: setErr } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'bank_account_number')
          .single();
        if (setErr) throw setErr;
        setBankAccount(setting.setting_value);
      } catch (err) {
        setMessage(`Chyba při načítání dat: ${err.message}`);
      }
    };
    fetchInitial();
  }, []);

  // Formátování SPAYD stringu pro QR
  useEffect(() => {
    if (paymentMethod === 'qr_code' && selectedCustomer && selectedProductId) {
      const prod = products.find(p => p.id === selectedProductId);
      if (prod && bankAccount) {
        const amount = Number(prod.price_czk).toFixed(2);
        const spayd = [
          'SPD*1.0',
          `ACC:${bankAccount}`,
          `AM:${amount}`,
          'CC:CZK',
          `MSG:Permanentka pro ${selectedCustomer.full_name}`
        ].join('*');
        setPaymentQrString(spayd);
      }
    } else {
      setPaymentQrString('');
    }
  }, [paymentMethod, selectedCustomer, selectedProductId, products, bankAccount]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.rpc('search_customers', {
        search_term: searchQuery,
      });
      if (error) throw error;
      setSearchResults(data);
      if (data.length === 0) {
        setMessage('Nenalezen žádný zákazník.');
      }
    } catch (err) {
      setMessage(`Chyba při vyhledávání: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCustomerForTopUp = (customer) => {
    setSelectedCustomer(customer);
    setSelectedProductId('');
    setPaymentMethod('cash');
    setMessage('');
  };

  const handleTopUp = async () => {
    if (!selectedCustomer || !selectedProductId || !paymentMethod) {
      setMessage('Prosím, vyberte zákazníka, produkt a metodu platby.');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.rpc('top_up_pass', {
        customer_id: selectedCustomer.id,
        product_id_to_add: selectedProductId,
        payment_method: paymentMethod,
      });
      if (error) throw error;
      setMessage(data.message || 'Permanentka byla úspěšně dobita.');
      // reset
      setSelectedCustomer(null);
      setSearchResults([]);
      setSearchQuery('');
      setSelectedProductId('');
      setPaymentMethod('cash');
    } catch (err) {
      setMessage(`Chyba při dobíjení: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        &larr; Zpět do menu
      </button>
      <h2 style={{ marginBottom: '1rem' }}>Dobití Permanentky</h2>

      {/* Vyhledání zákazníka */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Jméno nebo e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '0.5rem', width: '70%', marginRight: '0.5rem' }}
        />
        <button onClick={handleSearch} disabled={isLoading} style={{ padding: '0.5rem 1rem' }}>
          Hledat
        </button>
        {message && <p style={{ marginTop: '0.5rem', color: 'red' }}>{message}</p>}
      </div>
      {searchResults.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {searchResults.map(c => (
            <div
              key={c.id}
              onClick={() => selectCustomerForTopUp(c)}
              style={{
                padding: '0.5rem',
                cursor: 'pointer',
                background: selectedCustomer?.id === c.id ? '#dbeafe' : 'transparent',
                borderRadius: '0.25rem'
              }}
            >
              {c.full_name} ({c.email})
            </div>
          ))}
        </div>
      )}

      {/* Formulář dobíjení */}
      {selectedCustomer && (
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
          <h3 style={{ marginBottom: '1rem' }}>Dobít pro: <strong>{selectedCustomer.full_name}</strong></h3>

          {/* Výběr produktu */}
          <div style={{ marginBottom: '1rem' }}>
            <label>Balíček:</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="" disabled>-- Vyberte produkt --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.price_czk} Kč)
                </option>
              ))}
            </select>
          </div>

          {/* Metoda platby */}
          {selectedProductId && (
            <div style={{ marginBottom: '1rem' }}>
              <label>Metoda platby:</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: paymentMethod === 'cash' ? '#3b82f6' : '#e5e7eb',
                    color: paymentMethod === 'cash' ? 'white' : 'black'
                  }}
                >Hotově</button>
                <button
                  onClick={() => setPaymentMethod('qr_code')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: paymentMethod === 'qr_code' ? '#3b82f6' : '#e5e7eb',
                    color: paymentMethod === 'qr_code' ? 'white' : 'black'
                  }}
                >QR kód</button>
              </div>
            </div>
          )}

          {/* QR kód */}
          {paymentMethod === 'qr_code' && paymentQrString && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <QRCodeSVG value={paymentQrString} size={180} />
            </div>
          )}

          {/* Potvrdit */}
          <button
            onClick={handleTopUp}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              fontSize: '1rem'
            }}
          >
            {isLoading ? 'Pracuji...' : 'Potvrdit a dobít'}
          </button>
        </div>
      )}
    </div>
);

};

export default TopUpForm;
