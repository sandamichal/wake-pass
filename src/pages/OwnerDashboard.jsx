import React, { useState } from 'react';
import UserManagement from './UserManagement';
import Statistics from './Statistics';
import ProductManagement from './ProductManagement';
import TopUpForm from './TopUpForm';

const OwnerDashboard = () => {
  const [view, setView] = useState('menu'); // 'menu' | 'user_management' | 'statistics' | 'product_management' | 'topup'

  const renderContent = () => {
    switch (view) {
      case 'user_management':
        return <UserManagement onBack={() => setView('menu')} />;
      case 'statistics':
        return <Statistics onBack={() => setView('menu')} />;
      case 'product_management':
        return <ProductManagement onBack={() => setView('menu')} />;
      case 'topup':
        return <TopUpForm onBack={() => setView('menu')} />;
      default:
        return (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>
              Owner Menu
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <button
                onClick={() => setView('user_management')}
                style={buttonStyle}
              >
                Správa uživatelů a rolí
              </button>
              <button
                onClick={() => setView('statistics')}
                style={buttonStyle}
              >
                Statistiky
              </button>
              <button
                onClick={() => setView('product_management')}
                style={buttonStyle}
              >
                Správa produktů a ceníku
              </button>
              <button
                onClick={() => setView('topup')}
                style={buttonStyle}
              >
                Dobít permanentku
              </button>
            </div>
          </>
        );
    }
  };

  const buttonStyle = {
    padding: '1rem',
    textAlign: 'left',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer'
  };

  return (
    <div style={{ padding: '1rem' }}>
      {view !== 'menu' && (
        <button
          onClick={() => setView('menu')}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          &larr; Zpět do menu
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default OwnerDashboard;
