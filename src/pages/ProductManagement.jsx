import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ProductManagement = ({ onBack }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- new state for bank account management ---
  const [bankAccount, setBankAccount] = useState('');
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: '',
    hours_to_add: 0,
    price_czk: 0,
    category: 'permanentka',
  });

  useEffect(() => {
    fetchProducts();
    fetchBankAccount();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.rpc('get_products');
      if (error) throw error;

      const sorted = (data || []).sort((a, b) => {
        const byCategory = a.category.localeCompare(b.category);
        if (byCategory !== 0) return byCategory;
        return a.hours_to_add - b.hours_to_add;
      });

      setProducts(sorted);
    } catch (err) {
      setError('Nepodařilo se načíst produkty: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- fetch current bank account from system_settings ---
  const fetchBankAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'bank_account_number')
        .single();
      if (error && error.code !== 'PGRST116') throw error; // ignore "no rows" if not set
      if (data) {
        setBankAccount(data.setting_value);
      }
    } catch (err) {
      console.error('Chyba při načítání bankovního účtu:', err);
    }
  };

  // --- save bank account ---
  const handleSaveBankAccount = async () => {
    setLoadingAccount(true);
    setAccountMessage('');
    setAccountError(false);

    // sanitize: remove spaces, uppercase
    const sanitized = bankAccount.replace(/\s+/g, '').toUpperCase();

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'bank_account_number',
          setting_value: sanitized,
        });
      if (error) throw error;

      setAccountMessage('Bankovní účet úspěšně uložen.');
    } catch (err) {
      setAccountError(true);
      setAccountMessage('Chyba při ukládání účtu: ' + err.message);
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        const { error } = await supabase.rpc('update_product', {
          product_id: currentProduct.id,
          name: currentProduct.name,
          hours_to_add: Number(currentProduct.hours_to_add),
          price_czk: Number(currentProduct.price_czk),
          category: currentProduct.category,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('add_product', {
          name: currentProduct.name,
          hours_to_add: Number(currentProduct.hours_to_add),
          price_czk: Number(currentProduct.price_czk),
          category: currentProduct.category,
        });
        if (error) throw error;
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      setError('Chyba při ukládání produktu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setCurrentProduct(product);
  };

  const handleDeleteClick = async (productId) => {
    if (window.confirm('Opravdu chcete tento produkt smazat?')) {
      setLoading(true);
      try {
        const { error } = await supabase.rpc('delete_product', { product_id: productId });
        if (error) throw error;
        fetchProducts();
      } catch (err) {
        setError('Chyba při mazání produktu: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentProduct({
      id: null,
      name: '',
      hours_to_add: 0,
      price_czk: 0,
      category: 'permanentka',
    });
  };

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Zpět do menu</button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Správa Produktů a Ceníku</h2>

      {/* ---- Bank account management ---- */}
      <div
        style={{
          marginBottom: '2rem',
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '0.5rem',
          background: '#fbfbfb',
        }}
      >
        <h3 style={{ marginBottom: '0.5rem' }}>Správa bankovního účtu (SPAYD)</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="IBAN (např. CZ5401000000001111111111)"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.25rem',
              border: '1px solid #d1d5db',
            }}
          />
          <button
            onClick={handleSaveBankAccount}
            disabled={loadingAccount}
            style={{
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            {loadingAccount ? 'Ukládám…' : 'Uložit účet'}
          </button>
        </div>
        {accountMessage && (
          <div
            style={{
              marginTop: '0.5rem',
              color: accountError ? 'red' : 'green',
            }}
          >
            {accountMessage}
          </div>
        )}
      </div>

      {/* ---- Product form ---- */}
      <form
        onSubmit={handleFormSubmit}
        style={{
          marginBottom: '2rem',
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '0.5rem',
          display: 'grid',
          gap: '0.5rem',
        }}
      >
        <h3>{isEditing ? 'Upravit produkt' : 'Přidat nový produkt'}</h3>

        <div>
          <label htmlFor="name">Název produktu:</label>
          <input
            id="name"
            name="name"
            value={currentProduct.name}
            onChange={handleInputChange}
            placeholder="Např. 10 hodin wake"
            required
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label htmlFor="hours_to_add">Počet připsaných hodin:</label>
          <input
            id="hours_to_add"
            name="hours_to_add"
            type="number"
            step="0.5"
            value={currentProduct.hours_to_add}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label htmlFor="price_czk">Cena (Kč):</label>
          <input
            id="price_czk"
            name="price_czk"
            type="number"
            step="1"
            value={currentProduct.price_czk}
            onChange={handleInputChange}
            placeholder="Např. 2000"
            required
          />
        </div>

        <div>
          <label htmlFor="category">Kategorie:</label>
          <select
            id="category"
            name="category"
            value={currentProduct.category}
            onChange={handleInputChange}
            style={{ width: '100%' }}
          >
            <option value="permanentka">Permanentka</option>
            <option value="pujcovna">Půjčovna</option>
            <option value="ostatni">Ostatní</option>
          </select>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#16a34a',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
            }}
          >
            {isEditing ? 'Uložit změny' : 'Přidat produkt'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} style={{ marginLeft: '0.5rem' }}>
              Zrušit úpravu
            </button>
          )}
        </div>
      </form>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <th>Název</th>
              <th>Hodiny</th>
              <th>Cena (Kč)</th>
              <th>Kategorie</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb', lineHeight: '1.6' }}>
                <td>{p.name}</td>
                <td>{p.hours_to_add}</td>
                <td>{p.price_czk}</td>
                <td>{p.category}</td>
                <td>
                  <button onClick={() => handleEditClick(p)}>Upravit</button>
                  <button
                    onClick={() => handleDeleteClick(p.id)}
                    style={{ color: 'red', marginLeft: '0.5rem' }}
                  >
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagement;
