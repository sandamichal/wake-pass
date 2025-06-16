// soubor: src/components/Layout.jsx
import React from 'react';
import { supabase } from '../supabaseClient';

const Layout = ({ user, profile, activeRole, setActiveRole, children }) => {
  const userName = user.user_metadata?.full_name || user.email;

  const RoleSwitcher = () => {
    if (!profile || profile.roles.length <= 1) {
      return null;
    }
    return (
      <div style={{ marginTop: '0.5rem' }}>
        <label htmlFor="role-switcher" style={{ marginRight: '0.5rem', fontSize: '0.875rem' }}>
          Pohled:
        </label>
        <select 
          id="role-switcher"
          value={activeRole} 
          onChange={(e) => setActiveRole(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.25rem' }}
        >
          {profile.roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', // Zarovnání na začátek
        marginBottom: '2rem',
        gap: '1rem' // Přidána mezera mezi elementy
      }}>
        {/* Levá část s pozdravem a přepínačem */}
        <div style={{ flex: '1 1 auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, wordBreak: 'break-word' }}>
            Ahoj, {userName}!
          </h1>
          <RoleSwitcher />
        </div>
        
        {/* Pravá část s tlačítkem, které se nezmenšuje */}
        <button 
          onClick={() => supabase.auth.signOut()} 
          style={{ 
            flex: '0 0 auto', // Zabrání zmenšování tlačítka
            fontSize: '0.875rem', 
            color: '#4b5563', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            padding: '0.25rem' 
          }}
        >
          Odhlásit se
        </button>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
