import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Watchlist from './components/Watchlist';
import Settings from './components/Settings';
import SIPCalculator from './components/SIPCalculator';
import StockCatalogue from './components/StockCatalogue';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
  }, []);

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentView('login');
  };

  const handleUpdateProfile = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  if (currentView === 'dashboard' && user) {
    return (
      <Dashboard
        user={user}
        token={token}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
      />
    );
  }

  if (currentView === 'portfolio' && user) {
    return (
      <Portfolio
        user={user}
        token={token}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
      />
    );
  }

  if (currentView === 'watchlist' && user) {
    return (
      <Watchlist
        user={user}
        token={token}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
      />
    );
  }

  if (currentView === 'settings' && user) {
    return (
      <Settings
        user={user}
        token={token}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
        onUpdateProfile={handleUpdateProfile}
      />
    );
  }

  if (currentView === 'sip-calculator' && user) {
    return (
      <SIPCalculator
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
      />
    );
  }

  if (currentView === 'stocks' && user) {
    return (
      <StockCatalogue
        user={user}
        token={token}
        onLogout={handleLogout}
        onNavigate={setCurrentView}
      />
    );
  }

  return (
    <div className="App">
      <main className="App-main">
        {currentView === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setCurrentView('signup')}
          />
        )}

        {currentView === 'signup' && (
          <Signup
            onSignupSuccess={handleLoginSuccess}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
