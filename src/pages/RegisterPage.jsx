// soubor: src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const RegisterPage = ({ onSwitchView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError('Chyba při registraci: ' + error.message);
    } else {
      setMessage('Registrace úspěšná! Prosím, zkontrolujte svůj e-mail a klikněte na potvrzovací odkaz.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1rem', backgroundColor: '#f3f4f6' }}>
      {/* ZMĚNA ZDE: Přidáno boxSizing pro lepší kontrolu velikosti */}
      <div style={{ maxWidth: '24rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '2rem 1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '1rem' }}>Vytvořit účet</h1>
          
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            <input
              type="text"
              placeholder="Celé jméno"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
            />
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
              placeholder="Heslo (min. 6 znaků)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
            />
            <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Registruji...' : 'Zaregistrovat se'}
            </button>
          </form>
          
          {message && <p style={{ color: 'green', marginTop: '1rem' }}>{message}</p>}
          {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

          <div style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
            <span>Máte již účet? </span>
            <button onClick={onSwitchView} style={{ color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
              Přihlaste se
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
