import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';

const OperatorDashboard = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentQrString, setPaymentQrString] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: productsData, error: productsError } = await supabase.rpc('get_active_products', {
          product_category: 'permanentka',
        });
        if (productsError) throw productsError;
        setProducts(productsData || []);

        const { data: settingData, error: settingError } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'bank_account_number')
          .single();
        if (settingData) {
          setBankAccount(settingData.setting_value);
        }
      } catch (error) {
        setMessage('Chyba při načítání produktů nebo nastavení: ' + error.message);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (paymentMethod === 'qr_code' && selectedCustomer && selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product && bankAccount) {
        // formátujeme částku na dvě desetinná místa
        const amount = Number(product.price_czk).toFixed(2);
        // SPAYD string podle spec: SPD*1.0*ACC:<účet>*AM:<částka>*CC:CZK*MSG:<zpráva>*
        const spaydString = [
          'SPD*1.0',
          `ACC:${bankAccount}`,
          `AM:${amount}`,
          'CC:CZK',
          `MSG:Dobiti permanentky pro ${selectedCustomer.full_name}`
        ].join('*') + '*';
        setPaymentQrString(spaydString);
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
    } catch (error) {
      setMessage(`Chyba při vyhledávání: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
        setMessage(data.message);
      if (error) throw error;
      setMessage(data.message || 'Operace proběhla úspěšně.');
      setSelectedCustomer(null);
      setSearchResults([]);
      setSearchQuery('');
      setSelectedProductId('');
      setPaymentMethod('cash');
    } catch (error) {
      setMessage(`Chyba při nabíjení: ${error.message}`);
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

  const ScannerComponent = () => {
    useEffect(() => {
      let scanner;
      const onScanSuccess = async (decodedText) => {
        if (isLoading) return;
        if (scanner && scanner.getState() === 2) {
          scanner.clear().catch((err) => console.error('Nepodařilo se vyčistit skener.', err));
        }
        setIsScanning(false);
        setIsLoading(true);
        setMessage('Zpracovávám QR kód...');
        try {
          const { data, error } = await supabase.rpc('use_entry_with_nonce', {
            scanned_nonce: decodedText,
          });
          if (error) throw error;
          setMessage(data.message || 'Hodiny úspěšně odečteny.');
        } catch (err) {
          setMessage(`Chyba: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      scanner = new Html5QrcodeScanner('qr-reader-container', { qrbox: { width: 250, height: 250 }, fps: 10 }, false);
      scanner.render(onScanSuccess, () => {});
      return () => {
        if (scanner && scanner.getState() === 2) {
          scanner.clear().catch((err) => {});
        }
      };
    }, []);
    return <div id="qr-reader-container" style={{ width: '100%', border: '1px solid silver' }}></div>;
  };

  if (isScanning) {
    return (
      <div style={{ width: '100%', maxWidth: '500px', margin: 'auto', paddingTop: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Naskenujte QR kód zákazníka</h2>
        <ScannerComponent />
        <button onClick={() => setIsScanning(false)} style={{ width: '100%', marginTop: '1rem', padding: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          Zrušit
        </button>
      </div>
    );
  }

  return (
    <main>
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#fffbeb' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Odebrat hodiny</h2>
        <button onClick={() => setIsScanning(true)} style={{ width: '100%', padding: '0.75rem 1.5rem', background: '#f97316', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '1rem' }}>
          📸 Naskenovat QR Kód
        </button>
      </div>
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Nabít permanentku</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Nejprve vyhledejte zákazníka.</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" placeholder="Jméno nebo e-mail..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}/>
          <button onClick={handleSearch} disabled={isLoading} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Hledat</button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          {searchResults.map((customer) => (<div key={customer.id} onClick={() => selectCustomerForTopUp(customer)} style={{ padding: '0.5rem', cursor: 'pointer', background: selectedCustomer?.id === customer.id ? '#dbeafe' : 'transparent', borderRadius: '0.25rem' }}>{customer.full_name} ({customer.email})</div>))}
        </div>
      </div>
      {selectedCustomer && (
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Dobití pro: <span style={{ color: '#3b82f6' }}>{selectedCustomer.full_name}</span></h3>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="product-select">Vyberte balíček:</label>
            <select id="product-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}>
              <option value="" disabled>-- Vyberte produkt --</option>
              {products.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.price_czk} Kč)</option>))}
            </select>
          </div>
          {selectedProductId && (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Metoda platby:</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <button onClick={() => setPaymentMethod('cash')} style={{ flex: 1, padding: '0.5rem', background: paymentMethod === 'cash' ? '#3b82f6' : '#e5e7eb', color: paymentMethod === 'cash' ? 'white' : 'black', border: '1px solid #d1d5db' }}>Hotově</button>
                  <button onClick={() => setPaymentMethod('qr_code')} style={{ flex: 1, padding: '0.5rem', background: paymentMethod === 'qr_code' ? '#3b82f6' : '#e5e7eb', color: paymentMethod === 'qr_code' ? 'white' : 'black', border: '1px solid #d1d5db' }}>QR Kód</button>
                </div>
              </div>
              {paymentMethod === 'qr_code' && paymentQrString && (
                <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #ccc', marginBottom: '1rem' }}>
                  <p>Nechte zákazníka naskenovat tento kód:</p>
                  <div style={{ background: 'white', padding: '1rem', display: 'inline-block' }}>
                    <QRCodeSVG value={paymentQrString} size={180} />
                  </div>
                </div>
              )}
              <pre style={{
                marginTop: '1rem',
                padding: '0.5rem',
                background: '#f9f9f9',
                fontSize: '0.75rem',
                textAlign: 'left',
                whiteSpace: 'pre-wrap'
              }}>
                {paymentQrString}
              </pre>

              <button onClick={handleTopUp} disabled={isLoading} style={{ width: '100%', padding: '0.75rem 1.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '1rem' }}>
                {isLoading ? 'Pracuji...' : `Potvrdit platbu (${paymentMethod === 'cash' ? 'hotově' : 'QR'}) a Nabít`}
              </button>
            </div>
          )}
        </div>
      )}
      {message && <p style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.25rem' }}>{message}</p>}
    </main>
  );
};

export default OperatorDashboard;
