// src/pages/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ProductManagement = ({ onBack }) => {
  // Produkty
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Stav formuláře pro přidávání / úpravu produktu
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: '',
    hours_to_add: 0,
    price_czk: 0,
    category: 'permanentka',
  });

  // IBAN / účet
  const [accPrefix, setAccPrefix]       = useState('');
  const [accNumber, setAccNumber]       = useState('');
  const [accBankCode, setAccBankCode]   = useState('');
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError]     = useState(false);

  useEffect(() => {
    fetchBankAccount();
    fetchProducts();
  }, []);

  // Načtení produktů
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('get_products');
      if (rpcError) throw rpcError;
      const sorted = (data || []).sort((a, b) => {
        const byCat = a.category.localeCompare(b.category);
        return byCat !== 0 ? byCat : a.hours_to_add - b.hours_to_add;
      });
      setProducts(sorted);
    } catch (err) {
      setError('Nepodařilo se načíst produkty: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Načtení IBAN z DB
  const fetchBankAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'bank_account_number')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.setting_value) {
        const iban = data.setting_value;             // např. "CZ6508000000000123456789"
        const bban = iban.slice(4);                  // "080000000000123456789"
        setAccPrefix(bban.slice(0, 6));              // "080000"
        setAccNumber(bban.slice(6, 16));             // "0000000123"
        setAccBankCode(bban.slice(16, 20));          // "4567"
      }
    } catch (err) {
      console.error('Chyba při načítání účtu:', err);
    }
  };

  // Výpočet kontrolních cifer IBAN (CZ)
  const computeIban = (country, bban) => {
    const countryNums = country
      .split('')
      .map(c => c.charCodeAt(0) - 55)  // A→10 ... Z→35
      .join('');
    const toCheck = bban + countryNums + '00';
    let remainder = 0n;
    for (let i = 0; i < toCheck.length; i += 6) {
      const block = toCheck.slice(i, i + 6);
      remainder = (remainder * 10n ** BigInt(block.length) + BigInt(block)) % 97n;
    }
    const checkDigits = String(98n - remainder).padStart(2, '0');
    return country + checkDigits + bban;
  };

  // Uložení IBAN do system_settings
  const handleSaveBankAccount = async () => {
    setLoadingAccount(true);
    setAccountMessage('');
    setAccountError(false);

    const prefix = accPrefix.replace(/\D/g, '').padStart(6, '0');
    const number = accNumber.replace(/\D/g, '').padStart(10, '0');
    const bank   = accBankCode.replace(/\D/g, '').padStart(4, '0');
    const bban   = prefix + number + bank;
    const iban   = computeIban('CZ', bban);

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'bank_account_number',
          setting_value: iban,
        });
      if (error) throw error;
      setAccountMessage('IBAN uložen úspěšně: ' + iban);
    } catch (err) {
      setAccountError(true);
      setAccountMessage('Chyba při ukládání IBANu: ' + err.message);
    } finally {
      setLoadingAccount(false);
    }
  };

  // Handlery pro produktový formulář
  const handleInputChange = e => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
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

  const handleEditClick = product => {
    setIsEditing(true);
    setCurrentProduct(product);
  };

  const handleDeleteClick = async productId => {
    if (!window.confirm('Opravdu chcete produkt smazat?')) return;
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.rpc('delete_product', { product_id: productId });
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      setError('Chyba při mazání produktu: ' + err.message);
    } finally {
      setLoading(false);
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Správa Produktů a Ceníku
      </h2>

      {/* --- IBAN FORM --- */}
      <div
        style={{
          marginBottom: '2rem',
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '0.5rem',
          background: '#fbfbfb',
        }}
      >
        <h3 style={{ marginBottom: '0.5rem' }}>
          Číslo účtu (IBAN)
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="prefix"
            maxLength={6}
            value={accPrefix}
            onChange={e => setAccPrefix(e.target.value)}
            style={{ width: '4rem', padding: '0.5rem', textAlign: 'center' }}
          />
          <span>-</span>
          <input
            type="text"
            placeholder="číslo účtu"
            maxLength={10}
            value={accNumber}
            onChange={e => setAccNumber(e.target.value)}
            style={{ width: '8rem', padding: '0.5rem', textAlign: 'center' }}
          />
          <span>/</span>
          <input
            type="text"
            placeholder="bank.kód"
            maxLength={4}
            value={accBankCode}
            onChange={e => setAccBankCode(e.target.value)}
            style={{ width: '3rem', padding: '0.5rem', textAlign: 'center' }}
          />
          <button
            onClick={handleSaveBankAccount}
            disabled={loadingAccount}
            style={{
              marginLeft: '1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            {loadingAccount ? 'Ukládám…' : 'Uložit IBAN'}
          </button>
        </div>
        {accountMessage && (
          <div style={{ marginTop: '0.5rem', color: accountError ? 'red' : 'green' }}>
            {accountMessage}
          </div>
        )}
      </div>

      {/* --- PRODUKT FORM --- */}
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
          <label htmlFor="name">Název produktu:</label><br />
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
          <label htmlFor="hours_to_add">Počet hodin:</label><br />
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
          <label htmlFor="price_czk">Cena (Kč):</label><br />
          <input
            id="price_czk"
            name="price_czk"
            type="number"
            step="1"
            value={currentProduct.price_czk}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <label htmlFor="category">Kategorie:</label><br />
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
            <button
              type="button"
              onClick={resetForm}
              style={{ marginLeft: '0.5rem' }}
            >
              Zrušit
            </button>
          )}
        </div>
      </form>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {/* --- TABULKA PRODUKTŮ --- */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <th>Název</th><th>Hodiny</th><th>Cena (Kč)</th><th>Kategorie</th><th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
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
