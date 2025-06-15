import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { QrScanner } from '@yudiel/react-qr-scanner';

const OperatorDashboard = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState(10);
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
      const { data, error } = await supabase.functions.invoke('top-up-pass', {
        body: { 
          customerId: selectedCustomer.id, 
          amountToAdd: amountToAdd 
        },
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

  const handleScanResult = async (result) => {
    if (!!result) {
      setIsScanning(false);
      setIsLoading(true);
      setMessage('Zpracovávám QR kód...');
      try {
        const qrToken = result;
        const { data, error: funcError } = await supabase.functions.invoke('use-entry', {
          body: { qrToken },
        });

        if (funcError) throw funcError;
        setMessage(data.message || 'Vstup úspěšně odečten.');

      } catch (err) {
        setMessage(`Chyba při zpracování QR kódu: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const selectCustomerForTopUp = (customer) => {
    setSelectedCustomer(customer);
    setMessage('');
  }

  if (isScanning) {
    return (
      <div style={{ width: '100%', maxWidth: '500px', margin: 'auto', paddingTop: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Naskenujte QR kód zákazníka</h2>
        <QrScanner
          onDecode={handleScanResult}
          onError={(error) => console.log(error?.message)}
          containerStyle={{ width: '100%' }}
        />
        <button onClick={() => setIsScanning(false)} style={{ width: '100%', marginTop: '1rem', padding: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem' }}>
          Zrušit
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Režim Operátora</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '0.875rem', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          Odhlásit se
        </button>
      </header>

      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#ecfdf5' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Odebrat vstup</h2>
        <button onClick={() => setIsScanning(true)} style={{ width: '100%', padding: '0.75rem 1.5rem', background: '#f97316', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '1rem' }}>
          📸 Naskenovat QR Kód
        </button>
      </div>

      <div style