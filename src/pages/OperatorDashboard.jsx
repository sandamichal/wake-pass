import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';

const OperatorDashboard = ({ user }) => {
  // Stávající stavy
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Nové stavy pro logiku produktů
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentQrString, setPaymentQrString] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // Načtení produktů a bankovního účtu při startu
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Načteme produkty kategorie "permanentka"
        const { data: productsData, error: productsError } = await supabase.rpc('get_active_products', {
          product_category: 'permanentka',
        });
        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Načteme číslo účtu z nastavení
        const { data: settingData, error: settingError } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'bank_account_number')
          .single();
        if (settingError) throw settingError;
        if (settingData) {
          setBankAccount(settingData.setting_value);
        }
      } catch (error) {
        setMessage('Chyba při načítání produktů nebo nastavení: ' + error.message);
      }
    };

    fetchInitialData();
  }, []);

  // Vytvoření platebního QR kódu
  useEffect(() => {
    if (paymentMethod === 'qr_code' && selectedCustomer && selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product && bankAccount) {
        // Formát SPAYD pro české bankovní QR kódy
        const spaydString = `SPD*1.0*ACC:${bankAccount}*AM:${product.price_czk}*MSG:Dobiti permanentky pro ${selectedCustomer.email}`;
        setPaymentQrString(spaydString);
      }
    } else {
      setPaymentQrString('');
    }
  }, [paymentMethod, selectedCustomer, selectedProductId, products, bankAccount]);

  // --- Ostatní funkce (handleSearch, ScannerComponent, atd. zůstavají stejné) ---
  const handleSearch = async () => { /* ... kód zůstává stejný ... */ };
  const selectCustomerForTopUp = (customer) => { setSelectedCustomer(customer); setMessage(''); };
  const ScannerComponent = () => { /* ... kód zůstává stejný ... */ };

  // UPRAVENÁ FUNKCE PRO DOBITÍ
  const handleTopUp = async () => {
    if (!selectedCustomer || !selectedProductId || !paymentMethod) {
        setMessage('Prosím, vyberte zákazníka, produkt a metodu platby.');
        return;
    };

    setIsLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.rpc('top_up_pass', { 
        customer_id: selectedCustomer.id, 
        product_id_to_add: selectedProductId,
        payment_method: paymentMethod
      });
      if (error) throw error;
      setMessage(data.message || 'Operace proběhla úspěšně.');
      // Resetujeme stav po úspěšném nabití
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


  if (isScanning) { /* ... kód pro skener zůstává stejný ... */ }

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
        
        {/* Krok 1: Vyhledání zákazníka */}
        <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem'}}>Nejprve vyhledejte zákazníka.</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" placeholder="Jméno nebo e-mail..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}/>
          <button onClick={handleSearch} disabled={isLoading} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>Hledat</button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          {searchResults.map(customer => ( <div key={customer.id} onClick={() => selectCustomerForTopUp(customer)} style={{ padding: '0.5rem', cursor: 'pointer', background: selectedCustomer?.id === customer.id ? '#dbeafe' : 'transparent', borderRadius: '0.25rem' }}>{customer.full_name} ({customer.email})</div>))}
        </div>
      </div>

      {/* Krok 2: Zobrazí se po výběru zákazníka */}
      {selectedCustomer && (
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
            Dobití pro: <span style={{ color: '#3b82f6' }}>{selectedCustomer.full_name}</span>
          </h3>
          
          {/* Výběr produktu */}
          <div style={{marginBottom: '1rem'}}>
            <label htmlFor="product-select">Vyberte balíček:</label>
            <select id="product-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}}>
              <option value="" disabled>-- Vyberte produkt --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.price_czk} Kč)</option>
              ))}
            </select>
          </div>

          {/* Zobrazí se po výběru produktu */}
          {selectedProductId && (
            <div>
              {/* Výběr platby */}
              <div style={{marginBottom: '1rem'}}>
                  <label>Metoda platby:</label>
                  <div style={{display: 'flex', gap: '1rem', marginTop: '0.25rem'}}>
                      <button onClick={() => setPaymentMethod('cash')} style={{flex: 1, padding: '0.5rem', background: paymentMethod === 'cash' ? '#3b82f6' : '#e5e7eb', color: paymentMethod === 'cash' ? 'white' : 'black', border: '1px solid #d1d5db'}}>Hotově</button>
                      <button onClick={() => setPaymentMethod('qr_code')} style={{flex: 1, padding: '0.5rem', background: paymentMethod === 'qr_code' ? '#3b82f6' : '#e5e7eb', color: paymentMethod === 'qr_code' ? 'white' : 'black', border: '1px solid #d1d5db'}}>QR Kód</button>
                  </div>
              </div>
              
              {/* Zobrazení QR kódu */}
              {paymentMethod === 'qr_code' && paymentQrString && (
                <div style={{textAlign: 'center', padding: '1rem', border: '1px dashed #ccc', marginBottom: '1rem'}}>
                  <p>Nechte zákazníka naskenovat tento kód:</p>
                  <QRCodeSVG value={paymentQrString} size={180} />
                </div>
              )}
              
              {/* Finální potvrzení */}
              <button
                onClick={handleTopUp}
                disabled={isLoading}
                style={{ width: '100%', padding: '0.75rem 1.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '1rem' }}
              >
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
