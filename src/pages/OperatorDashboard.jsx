// soubor: src/pages/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CustomerDashboard = ({ user }) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Získáme jméno z metadat, pokud neexistuje, použijeme email
  const userName = user.user_metadata?.full_name || user.email;

  // Tento 'useEffect' se spustí jednou, když se komponenta poprvé zobrazí
  useEffect(() => {
    // Vytvoříme funkci pro načtení dat
    const fetchPassBalance = async () => {
      try {
        // Dotaz do databáze Supabase
        const { data, error } = await supabase
          .from('passes') // Z tabulky 'passes'
          .select('entries_balance') // Vyber sloupec 'entries_balance'
          .eq('user_id', user.id) // Kde se 'user_id' rovná ID přihlášeného uživatele
          .single(); // Očekáváme právě jeden výsledek

        if (error) {
          // Pokud nastane chyba v dotazu, uložíme ji
          throw error;
        }

        if (data) {
          // Pokud data přijdou, uložíme počet vstupů do našeho 'stavu'
          setBalance(data.entries_balance);
        }
      } catch (err) {
        console.error('Chyba při načítání permanentky:', err);
        setError('Nepodařilo se načíst data o permanentce.');
      } finally {
        // Ať už to dopadne jakkoliv, přestaneme načítat
        setLoading(false);
      }
    };

    fetchPassBalance(); // Spustíme funkci pro načtení dat
  }, [user.id]); // Tento efekt se znovu spustí, jen pokud se změní ID uživatele

  // Funkce, která zobrazí obsah hlavní karty
  const renderBalanceCard = () => {
    if (loading) {
      return <p>Načítám permanentku...</p>;
    }
    if (error) {
      return <p style={{ color: 'red' }}>{error}</p>;
    }
    return (
      <>
        <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Váš aktuální zůstatek</p>
        <p style={{ fontSize: '5rem', fontWeight: '800', color: '#3b82f6', margin: '0.5rem 0', lineHeight: '1' }}>
          {balance}
        </p>
        <p style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: '600' }}>VSTUPŮ</p>
      </>
    );
  };
  
  // Zde bude logika pro QR kód, kterou přidáme později
  const handleUseEntry = () => {
    alert('Funkce pro použití vstupu a zobrazení QR kódu bude implementována brzy!');
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Ahoj, {userName}!</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '0.875rem', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}>
          Odhlásit se
        </button>
      </header>

      <main style={{ textAlign: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', marginBottom: '2.5rem' }}>
          {renderBalanceCard()}
        </div>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
           <button
            onClick={handleUseEntry}
            disabled={loading || balance === 0}
            style={{ width: '100%', background: '#16a34a', color: 'white', fontSize: '1.25rem', fontWeight: 'bold', padding: '1rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', cursor: 'pointer', opacity: (loading || balance === 0) ? 0.5 : 1 }}
          >
            POUŽÍT VSTUP (QR KÓD)
          </button>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;