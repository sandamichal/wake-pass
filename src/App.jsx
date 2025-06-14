// soubor: src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import OperatorDashboard from './pages/OperatorDashboard';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeRole, setActiveRole] = useState(null); // Nový stav pro aktivní roli
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getProfile(session.user);
      } else {
        setProfile(null);
        setActiveRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getProfile = async (user) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`roles, full_name, avatar_url`) // Načítáme nové pole "roles"
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        // Nastavíme výchozí aktivní roli na 'customer', pokud ji uživatel má
        if (data.roles.includes('customer')) {
          setActiveRole('customer');
        } else {
          setActiveRole(data.roles[0]); // Jinak nastavíme první dostupnou roli
        }
      }
    } catch (error) {
      console.error('Chyba při načítání profilu:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!session || !profile) {
      return <LoginPage />;
    }

    // Zde rozhodujeme podle aktivní role, nikoliv podle role v profilu
    if (activeRole === 'operator' || activeRole === 'owner') {
      return <OperatorDashboard user={session.user} />;
    } else {
      return <CustomerDashboard user={session.user} />;
    }
  };

  const RoleSwitcher = () => {
    if (!profile || profile.roles.length <= 1) {
      return null; // Pokud má uživatel jen jednu roli, menu nezobrazujeme
    }
    return (
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10 }}>
        <select 
          value={activeRole} 
          onChange={(e) => setActiveRole(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.25rem' }}
        >
          {profile.roles.map(role => (
            <option key={role} value={role}>
              Pohled: {role}
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (loading) {
    return <div>Načítání...</div>;
  }

  return (
    <div className="App">
      <RoleSwitcher />
      {renderContent()}
    </div>
  );
}

export default App;