// soubor: src/pages/OperatorDashboard.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const OperatorDashboard = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      // Voláme naši bezpečnou databázovou funkci 'search_customers'
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
      // Zavoláme naši Edge Function 'top-up-pass'
      const { data, error } = await supabase.functions.invoke('top-up-pass', {
        body: { 
          customerId: selectedCustomer.id, 
          amountToAdd: amountToAdd 
        },
      });

      if (error) throw error;
      
      setMessage(data.message || 'Operace proběhla úspěšně.');
      // Po úspěchu zrušíme výběr a vyčistíme výsledky
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
    setMessage(''); // Vyčistíme staré zprávy
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Režim Operátora</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '0.875rem', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          Odhlásit se
        </button>
      </header>

      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>1. Najít zákazníka</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Jméno nebo e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
          />
          <button onClick={handleSearch} disabled={isLoading} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}>
            {isLoading ? 'Hledám...' : 'Hledat'}
          </button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          {searchResults.map(customer => (
            <div key={customer.id} onClick={() => selectCustomerForTopUp(customer)} style={{ padding: '0.5rem', cursor: 'pointer', background: selectedCustomer?.id === customer.id ? '#dbeafe' : 'transparent', borderRadius: '0.25rem' }}>
              {customer.full_name} ({customer.email})
            </div>
          ))}
        </div>
      </div>

      {selectedCustomer && (
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            2. Nabít permanentku pro: <span style={{ color: '#3b82f6' }}>{selectedCustomer.full_name}</span>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              value={amountToAdd}
              onChange={(e) => setAmountToAdd(parseInt(e.target.value, 10))}
              style={{ padding: '0.5rem', width: '5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
            />
            <span style={{ fontWeight: '500' }}>vstupů</span>
            <button
              onClick={handleTopUp}
              disabled={isLoading || !amountToAdd || amountToAdd <= 0}
              style={{ marginLeft: 'auto', padding: '0.75rem 1.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: (isLoading || !amountToAdd || amountToAdd <= 0) ? 0.5 : 1 }}
            >
              {isLoading ? 'Pracuji...' : 'Potvrdit Nabití'}
            </button>
          </div>
        </div>
      )}
      
      {message && <p style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.25rem' }}>{message}</p>}
    </div>
  );
};

export default OperatorDashboard;