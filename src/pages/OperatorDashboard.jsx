// soubor: src/pages/OperatorDashboard.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const OperatorDashboard = ({ user }) => {
  // Stavy pro ukládání dat v komponentě
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // --- Funkce, které implementujeme v dalších krocích ---
  const handleSearch = async () => {
    // Tuto funkci naplníme za chvíli
    alert('Funkce vyhledávání bude brzy implementována!');
  };

  const handleTopUp = async () => {
    // Tuto funkci naplníme za chvíli
    alert('Funkce pro nabití bude brzy implementována!');
  };
  // -----------------------------------------------------

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Režim Operátora</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '0.875rem', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          Odhlásit se
        </button>
      </header>

      {/* Sekce pro vyhledání zákazníka */}
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
          <button onClick={handleSearch} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
            Hledat
          </button>
        </div>
        {/* Zde se zobrazí výsledky hledání */}
        <div style={{ marginTop: '1rem' }}>
          {searchResults.map(customer => (
            <div key={customer.id} onClick={() => setSelectedCustomer(customer)} style={{ padding: '0.5rem', cursor: 'pointer', background: selectedCustomer?.id === customer.id ? '#dbeafe' : 'transparent', borderRadius: '0.25rem' }}>
              {customer.full_name} ({customer.email})
            </div>
          ))}
        </div>
      </div>

      {/* Sekce pro nabití, zobrazí se po výběru zákazníka */}
      {selectedCustomer && (
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
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
              disabled={isLoading}
              style={{ marginLeft: 'auto', padding: '0.75rem 1.5rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}
            >
              {isLoading ? 'Nabíjím...' : 'Potvrdit Nabití'}
            </button>
          </div>
        </div>
      )}
      
      {/* Místo pro zobrazení zpráv (úspěch/chyba) */}
      {message && <p style={{ marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.25rem' }}>{message}</p>}
    </div>
  );
};

export default OperatorDashboard;