import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import OperatorDashboard from './pages/OperatorDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // State pro zobrazení chyby na obrazovce

  useEffect(() => {
    console.log('KROK 1: App.jsx se načetl, nastavuji sledování stavu přihlášení.');

    supabase.auth.onAuthStateChange((_event, session) => {
      console.log('KROK 2: Změna stavu přihlášení! Nová session:', session);
      setSession(session);
      if (session) {
        getProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Tento kód se spustí jen jednou na začátku, aby zjistil, jestli už nejsme přihlášení
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            setLoading(false);
        }
    })

  }, []);

  const getProfile = async (user) => {
    console.log('KROK 3: Spouštím getProfile pro uživatele s ID:', user.id);
    setError(''); 
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from('users')
        .select(`*`) // Načteme vše, abychom viděli celý profil
        .eq('id', user.id)
        .single();

      console.log('KROK 4: Výsledek dotazu do DB:', { data, error, status });

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        console.log('KROK 5: Data nalezena, ukládám profil:', data);
        setProfile(data);
      } else {
        console.log('KROK 6: Data pro uživatele nenalezena (data jsou null).');
        setError('Profil pro vašeho uživatele nebyl v databázi nalezen. Záznam v tabulce "users" pravděpodobně chybí.');
      }
    } catch (error) {
      console.error('KROK 7: Chyba v getProfile:', error);
      setError(`Chyba při načítání profilu: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Rozhodovací logika pro zobrazení
  if (loading) {
    return <div>Načítání...</div>;
  }
  if (!session) {
    return <LoginPage />;
  }
  if (error) {
    return <div style={{color: 'red', padding: '20px'}}>CHYBA: {error}</div>;
  }
  if (profile) {
    if (profile.role === 'operator' || profile.role === 'owner') {
      return <OperatorDashboard user={session.user} />;
    } else {
      return <CustomerDashboard user={session.user} />;
    }
  }
  // Tento stav by neměl nastat, pokud je vše v pořádku
  return <div>Neznámý stav. Jste přihlášen, ale váš profil se nepodařilo načíst.</div>;
}

export default App;