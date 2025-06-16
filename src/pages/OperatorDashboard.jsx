import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Html5QrcodeScanner } from 'html5-qrcode';

const OperatorDashboard = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);

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
    if (!selectedCustomer) return;
    setIsLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.rpc('top_up_pass', { 
        customer_id: selectedCustomer.id, 
        amount_to_add: amountToAdd 
      });
      if (error) throw error;
      setMessage(data.message || 'Operace proběhla úspěšně.');
      setSelectedCustomer(null); 
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      setMessage(`Chyba při nabíjení: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCustomerForTopUp = (customer) => {
    setSelectedCustomer(customer);
    setMessage('');
  };

  const ScannerComponent = () => {
    useEffect(() => {
      let scanner;
      const onScanSuccess = async (decodedText) => {
        if (isLoading) return;
        if (scanner && scanner.getState() === 2) {
          scanner.clear().catch(err => console.error("Nepodařilo se vyčistit skener.", err));
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
      
      scanner = new Html5QrcodeScanner('qr-reader-container', { qrbox: { width: 250, height: 250 }, fps: 10, }, false);
      scanner.render(onScanSuccess, () => {});
      
      return () => {
        if (scanner) {
          // Pokusíme se zastavit skener, pouze pokud ještě běží
          if (scanner.getState() === 2) { // 2 = SCANNING
             scanner.clear().catch(err => {});
          }
        }
      };
    }, []);

    return <div id="qr-reader-container" style={{width: '100%', border: '1px solid silver'}}></div>;
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
        <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem'}}>Nejprve vyhledejte zákazníka, poté zadejte počet hodin.</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" placeholder="Jméno nebo e-mail..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}/>
          <button onClick={handleSearch} disabled={isLoading} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}>
            {isLoading ? 'Hledám...' : 'Hledat'}
          </button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          {searchResults.map(customer => ( <div key={customer.id} onClick={() => selectCustomerForTopUp(customer)} style={{ padding: '0.5rem', cursor: 'pointer', background: selectedCustomer?.id === customer.id ? '#dbeafe' : 'transparent', borderRadius: '0.25rem' }}>{customer.full_name} ({customer.email})</div>))}
        </div>
      </div>

      {selectedCustomer && ( <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}> <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Dobití pro: <span style={{ color: '#3b82f6' }}>{selectedCustomer.full_name}</span></h2><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="number" step="0.5" min="0.5" value={amountToAdd} onChange={(e) => setAmountToAdd(Number(e.target.value))} style={{ padding: '0.5rem', width: '5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }} /><span style={{ fontWeight: '500' }}>hodin</span><button onClick={handleTopUp} disabled={isLoading || !amountToAdd || amountToAdd <= 0} style={{ marginLeft: 'auto', padding: '0.75rem 1.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: (isLoading || !amountToAdd || amountToAdd <= 0) ? 0.5 : 1 }}>{isLoading ? 'Pracuji...' : 'Potvrdit Nabití'}</button></div></div>)}
      
      {message && <p style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.25rem' }}>{message}</p>}
    </main>
  );
};

export default OperatorDashboard;