import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Signup({ onSignupSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onSignupSuccess(data.user, data.token);
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up for Wealthify</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div className="switch-view">
        Already have an account? 
        <button onClick={onSwitchToLogin}>Login here</button>
      </div>
    </div>
  );
}

export default Signup;
