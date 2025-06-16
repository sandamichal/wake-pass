// soubor: src/pages/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const UserManagement = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [userRoles, setUserRoles] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('get_users_for_management');
      if (rpcError) throw rpcError;
      setUsers(data || []);
    } catch (err) {
      setError('Nepodařilo se načíst uživatele: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setUserRoles({
      customer: user.roles.includes('customer'),
      operator: user.roles.includes('operator'),
      owner: user.roles.includes('owner'),
    });
  };

  const handleRoleChange = (role) => {
    setUserRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const handleSaveRoles = async () => {
    const newRoles = Object.keys(userRoles).filter(role => userRoles[role]);
    if (newRoles.length === 0) {
        setError('Uživatel musí mít alespoň jednu roli.');
        return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: rpcError } = await supabase.rpc('update_user_roles', {
        user_id_to_update: editingUser.id,
        new_roles: newRoles,
      });
      if (rpcError) throw rpcError;
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError('Chyba při ukládání rolí: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <div>Načítám seznam uživatelů...</div>;
  }

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>
        &larr; Zpět do menu
      </button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Správa Uživatelů a Rolí</h2>
      
      {error && <div style={{ color: 'red', padding: '1rem', border: '1px solid red', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{borderBottom: '2px solid #ccc'}}>
              <th style={{ padding: '0.5rem' }}>Jméno</th>
              <th style={{ padding: '0.5rem' }}>E-mail</th>
              <th style={{ padding: '0.5rem' }}>Role</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Akce</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{borderBottom: '1px solid #eee'}}>
                <td style={{ padding: '0.5rem' }}>{user.full_name || '(Jméno chybí)'}</td>
                <td style={{ padding: '0.5rem' }}>{user.email}</td>
                <td style={{ padding: '0.5rem' }}>
                  {editingUser?.id === user.id ? (
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                      <label><input type="checkbox" checked={!!userRoles.customer} onChange={() => handleRoleChange('customer')} /> customer</label>
                      <label><input type="checkbox" checked={!!userRoles.operator} onChange={() => handleRoleChange('operator')} /> operator</label>
                      <label><input type="checkbox" checked={!!userRoles.owner} onChange={() => handleRoleChange('owner')} /> owner</label>
                    </div>
                  ) : (
                    user.roles.join(', ')
                  )}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {editingUser?.id === user.id ? (
                    <>
                      <button onClick={handleSaveRoles} disabled={loading} style={{marginRight: '0.5rem', background: '#16a34a', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer'}}>Uložit</button>
                      <button onClick={() => setEditingUser(null)} style={{background: '#6b7280', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer'}}>Zrušit</button>
                    </>
                  ) : (
                    <button onClick={() => handleEditClick(user)} style={{background: '#3b82f6', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer'}}>Upravit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
