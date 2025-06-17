// soubor: src/pages/OwnerDashboard.jsx
import React, { useState } from 'react';
import UserManagement from './UserManagement';
import Statistics from './Statistics';
import ProductManagement from './ProductManagement'; // Nový import

const OwnerDashboard = () => {
  const [view, setView] = useState('menu');

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
  if (view === 'product_management') {
    return <ProductManagement onBack={() => setView('menu')} />;
  }
  
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Owner Menu</h2>
      <div>
        <button style={buttonStyle} onClick={() => setView('user_management')}>Správa Uživatelů a Rolí</button>
        <button style={buttonStyle} onClick={() => setView('statistics')}>Statistiky</button>
        <button style={buttonStyle} onClick={() => setView('product_management')}>Správa Produktů a Ceníku</button>
      </div>
    </div>
  );
};

export default OwnerDashboard;
