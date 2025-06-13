// soubor: src/App.js
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import OperatorDashboard from './pages/OperatorDashboard'; // Přidali jsme import pro nový dashboard

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // Nový stav pro uložení profilu z naší tabulky
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sledování změn v přihlášení
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Pokud je uživatel přihlášen, načteme jeho profil. Pokud ne, profil smažeme.
      if (session) {
        getProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Nová funkce pro načtení profilu z naší tabulky 'users'
  const getProfile = async (user) => {
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from('users')
        .select(`role, full_name, avatar_url`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        // DIAGNOSTICKÝ VÝPIS: Podívejme se, co přesně přišlo z databáze
        console.log('NAČTENÝ PROFIL Z DATABÁZE:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Chyba při načítání profilu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pomocná funkce, která rozhodne, co se má zobrazit
  const renderContent = () => {
    if (!session || !profile) {
      return <LoginPage />;
    }

    if (profile.role === 'operator' || profile.role === 'owner') {
      return <OperatorDashboard user={session.user} />;
    } else {
      return <CustomerDashboard user={session.user} />;
    }
  };

  return (
    <div className="App">
      {loading ? <div>Načítání...</div> : renderContent()}
    </div>
  );
}

export default App;