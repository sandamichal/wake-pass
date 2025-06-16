// soubor: src/pages/OwnerDashboard.jsx
import React, { useState } from 'react';
import UserManagement from './UserManagement';
import Statistics from './Statistics'; // Nový import

const OwnerDashboard = () => {
  const [view, setView] = useState('menu'); // 'menu', 'user_management', 'statistics'

  const buttonStyle = {
    display: 'block',
    width: '100%',
    padding: '1rem',
    marginBottom: '1rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    textAlign: 'left',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  };

  if (view === 'user_management') {
    return <UserManagement onBack={() => setView('menu')} />;
  }
  
  if (view === 'statistics') {
    return <Statistics onBack={() => setView('menu')} />;
  }
  
  // Výchozí pohled je menu
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Owner Menu</h2>
      <div>
        <button 
          style={buttonStyle}
          onClick={() => setView('user_management')}
        >
          Správa Uživatelů a Rolí
        </button>
        <button 
          style={buttonStyle}
          onClick={() => setView('statistics')}
        >
          Statistiky
        </button>
        <button 
          style={buttonStyle}
          onClick={() => alert('Tato sekce bude brzy implementována!')}
        >
          Nastavení systému (již brzy)
        </button>
      </div>
    </div>
  );
};

export default OwnerDashboard;
