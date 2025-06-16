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
        <label htmlFor="role-switcher" style={{ marginRight: '0.5rem', fontSize: '0.875rem' }}>Pohled:</label>
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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Ahoj, {userName}!</h1>
          <RoleSwitcher />
        </div>
        <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '0.875rem', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
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