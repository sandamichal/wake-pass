// soubor: src/pages/LoginPage.jsx
import React from 'react';
import { FcGoogle } from 'react-icons/fc'; 
import { supabase } from '../supabaseClient'; 

const LoginPage = () => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Chyba při přihlašování přes Google:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1rem', backgroundColor: '#f3f4f6' }}>
      <div style={{ maxWidth: '24rem', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '1rem' }}>WakePass</h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>Vaše permanentka. Vždy po ruce.</p>

        <div style={{ marginTop: '3rem' }}>
          <button
            onClick={handleGoogleLogin}
            style={{ 
              width: '100%', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: 'white', 
              padding: '0.75rem 1rem', 
              border: '1px solid #d1d5db', 
              borderRadius: '0.5rem', 
              fontSize: '1.125rem', 
              fontWeight: '500', 
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            <FcGoogle style={{ marginRight: '0.75rem', fontSize: '1.5rem' }} />
            Přihlásit se přes Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;