// soubor: src/pages/OperatorDashboard.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const OperatorDashboard = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      // Voláme naši bezpečnou databázovou funkci 'search_customers'
      const { data, error } = await supabase.rpc('search_customers', {
        search_term: searchQuery,
      });

      if (error) throw error;

      setSearchResults(data);
      if (data.length === 0) {
        setMessage('Nenalezen žádný zákazník.');
      }
    } catch (error) {
      setMessage(`Chyba při vyhledávání: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!selectedCustomer) return;
    
    setIsLoading(true);
    setMessage('');
    try {
      // Zavoláme naši Edge Function 'top-up-pass'
      const { data, error } = await supabase.functions.invoke('top-up-pass', {
        body: { 
          customerId: selectedCustomer.id, 
          amountToAdd: amountToAdd 
        },
      });

      if (error) throw error;
      
      setMessage(data.message || 'Operace proběhla úspěšně.');
      // Po úspěchu zrušíme výběr a vyčistíme výsledky
      setSelectedCustomer(null); 
      setSearchResults([]);
      setSearchQuery('');
      
    } catch (error) {
      setMessage(`Chyba při nabíjení: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCustomerForTopUp = (customer) => {
    setSelectedCustomer(customer);
    setMessage(''); // Vyčistíme staré zprávy
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>