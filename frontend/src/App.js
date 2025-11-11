import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    localStorage.setItem('token', authToken);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    setCurrentView('login');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Wealthify</h1>
        <p>Stock Management & Analysis Platform</p>
      </header>

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

        {currentView === 'dashboard' && user && (
          <Dashboard 
            user={user}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}

export default App;
