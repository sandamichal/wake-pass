import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import Layout from './components/Layout';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState('login');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getProfile(session.user);
      } else {
        setProfile(null);
        setActiveRole(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const getProfile = async (user) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`roles, full_name, avatar_url`)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        if (data.roles.includes('owner')) {
          setActiveRole('owner');
        } else if (data.roles.includes('operator')) {
          setActiveRole('operator');
        } else {
          setActiveRole('customer');
        }
      }
    } catch (error) {
      console.error('Chyba při načítání profilu:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!session) {
      if (authView === 'login') {
        return <LoginPage onSwitchView={() => setAuthView('register')} />;
      } else {
        return <RegisterPage onSwitchView={() => setAuthView('login')} />;
      }
    }
    
    if (loading || !profile) {
      return <div style={{padding: '2rem', textAlign: 'center'}}>Načítání...</div>;
    }

    const dashboard = activeRole === 'operator' || activeRole === 'owner'
      ? <OperatorDashboard user={session.user} />
      : <CustomerDashboard user={session.user} />;

    return (
      <Layout 
        user={session.user} 
        profile={profile} 
        activeRole={activeRole} 
        setActiveRole={setActiveRole}
      >
        {dashboard}
      </Layout>
    );
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
}

export default App;
