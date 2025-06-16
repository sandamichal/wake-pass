// soubor: src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '../supabaseClient';

const LoginPage = ({ onSwitchView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      setMessage('Chyba při přihlášení: ' + error.message);
    }
    // Pokud je přihlášení úspěšné, onAuthStateChange v App.jsx se postará o zbytek
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1rem', backgroundColor: '#f3f4f6' }}>
      {/* ZMĚNA ZDE: Přidáno boxSizing pro lepší kontrolu velikosti */}
      <div style={{ maxWidth: '24rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '2rem 1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '1rem' }}>WakePass</h1>
          <p style={{ color: '#4b5563', marginTop: '0.5rem', marginBottom: '2rem' }}>Vaše permanentka. Vždy po ruce.</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
            />
            <input
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
            />
            <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Přihlašuji...' : 'Přihlásit se'}
            </button>
          </form>

          <div style={{ margin: '1rem 0', color: '#9ca3af' }}>nebo</div>

          <button onClick={handleGoogleLogin} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }} >
            <FcGoogle style={{ marginRight: '0.75rem', fontSize: '1.5rem' }} />
            Přihlásit se přes Google
          </button>
          
          {message && <p style={{ color: 'red', marginTop: '1rem' }}>{message}</p>}

          <div style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
            <span>Nemáte účet? </span>
            <button onClick={onSwitchView} style={{ color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
              Zaregistrujte se
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
