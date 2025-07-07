// src/pages/OwnerDashboard.jsx
import React, { useState } from 'react'
import UserManagement from './UserManagement'
import Statistics     from './Statistics'
import ProductManagement from './ProductManagement'
import TopUpForm      from './TopUpForm'        // ← correct import

const OwnerDashboard = () => {
  const [view, setView] = useState('menu')  // 'menu' | 'user_management' | 'statistics' | 'product_management' | 'topup'

  const renderContent = () => {
    switch (view) {
      case 'user_management':
        return <UserManagement onBack={() => setView('menu')} />

      case 'statistics':
        return <Statistics onBack={() => setView('menu')} />

      case 'product_management':
        return <ProductManagement onBack={() => setView('menu')} />

      case 'topup':
        return <TopUpForm onBack={() => setView('menu')} />

      default:
        // Main owner menu
        return (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>
              Owner Menu
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <button onClick={() => setView('user_management')} style={btn}>
                Správa Uživatelů a Rolí
              </button>
              <button onClick={() => setView('statistics')} style={btn}>
                Statistiky
              </button>
              <button onClick={() => setView('product_management')} style={btn}>
                Správa Produktů a Ceníku
              </button>
              <button onClick={() => setView('topup')} style={btn}>
                Dobití Permanentky
              </button>
            </div>
          </>
        )
    }
  }

  return (
    <div style={{ padding: '1rem' }}>
      {view !== 'menu' && (
        <button onClick={() => setView('menu')} style={backBtn}>
          &larr; Zpět do menu
        </button>
      )}
      {renderContent()}
    </div>
  )
}

// styling shortcuts
const btn = {
  padding: '1rem',
  textAlign: 'left',
  background: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  fontSize: '1.1rem',
  fontWeight: '600',
  cursor: 'pointer',
}

const backBtn = {
  marginBottom: '1rem',
  padding: '0.5rem 1rem',
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  cursor: 'pointer',
}

export default OwnerDashboard
