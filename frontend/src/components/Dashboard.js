import React from 'react';

function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard">
      <h2>Welcome to Wealthify! 🎉</h2>
      
      <div className="user-info">
        <h3>Your Profile</h3>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>

      <p style={{ color: '#666', marginTop: '1.5rem' }}>
        You're successfully logged in! Stock management features coming soon...
      </p>

      <button className="btn logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
