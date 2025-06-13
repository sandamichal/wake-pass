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
        <p