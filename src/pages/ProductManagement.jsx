// soubor: src/pages/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ProductManagement = ({ onBack }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stavy pro formulář (pro přidávání i editaci)
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ id: null, name: '', hours_to_add: 0, price_czk: 0, category: 'permanentka', is_active: true });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.rpc('get_products');
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError('Nepodařilo se načíst produkty: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        // Voláme funkci pro úpravu
        const { error } = await supabase.rpc('update_product', {
          product_id: currentProduct.id,
          name: currentProduct.name,
          hours_to_add: Number(currentProduct.hours_to_add),
          price_czk: Number(currentProduct.price_czk),
          category: currentProduct.category,
          is_active: currentProduct.is_active
        });
        if (error) throw error;
      } else {
        // Voláme funkci pro přidání
        const { error } = await supabase.rpc('add_product', {
          name: currentProduct.name,
          hours_to_add: Number(currentProduct.hours_to_add),
          price_czk: Number(currentProduct.price_czk),
          category: currentProduct.category
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
      if (window.confirm('Opravdu chcete tento produkt deaktivovat?')) {
          setLoading(true);
          try {
              const { error } = await supabase.rpc('delete_product', { product_id: productId });
              if (error) throw error;
              fetchProducts();
          } catch(err) {
              setError('Chyba při deaktivaci produktu: ' + err.message);
          } finally {
              setLoading(false);
          }
      }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentProduct({ id: null, name: '', hours_to_add: 0, price_czk: 0, category: 'permanentka', is_active: true });
  };
  
  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1rem' }}>&larr; Zpět do menu</button>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Správa Produktů a Ceníku</h2>
      
      {/* Formulář pro přidání/editaci */}
      <form onSubmit={handleFormSubmit} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '0.5rem' }}>
        <h3>{isEditing ? 'Upravit produkt' : 'Přidat nový produkt'}</h3>
        <input name="name" value={currentProduct.name} onChange={handleInputChange} placeholder="Název produktu" required />
        <input name="hours_to_add" type="number" step="0.5" value={currentProduct.hours_to_add} onChange={handleInputChange} placeholder="Počet hodin" required />
        <input name="price_czk" type="number" value={currentProduct.price_czk} onChange={handleInputChange} placeholder="Cena (Kč)" required />
        <select name="category" value={currentProduct.category} onChange={handleInputChange}>
          <option value="permanentka">Permanentka</option>
          <option value="pujcovna">Půjčovna</option>
          <option value="ostatni">Ostatní</option>
        </select>
        {isEditing && <label><input type="checkbox" name="is_active" checked={currentProduct.is_active} onChange={handleInputChange} /> Aktivní</label>}
        <button type="submit" disabled={loading}>{isEditing ? 'Uložit změny' : 'Přidat produkt'}</button>
        {isEditing && <button type="button" onClick={resetForm}>Zrušit úpravu</button>}
      </form>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {/* Tabulka produktů */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{borderBottom: '2px solid #ccc'}}>
              <th>Název</th><th>Hodiny</th><th>Cena (Kč)</th><th>Kategorie</th><th>Aktivní</th><th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{borderBottom: '1px solid #eee'}}>
                <td>{p.name}</td><td>{p.hours_to_add}</td><td>{p.price_czk}</td><td>{p.category}</td><td>{p.is_active ? 'Ano' : 'Ne'}</td>
                <td>
                  <button onClick={() => handleEditClick(p)}>Upravit</button>
                  {p.is_active && <button onClick={() => handleDeleteClick(p.id)} style={{color: 'red'}}>Deaktivovat</button>}
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
