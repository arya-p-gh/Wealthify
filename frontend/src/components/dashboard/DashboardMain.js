import React from 'react';

function DashboardMain({ user }) {
  return (
    <div className="dashboard-main">
      <h2>Welcome to Wealthify!</h2>
      <p>Manage your portfolios, transactions and watchlists.</p>

      <div className="user-summary">
        <h3>Your Profile</h3>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>
    </div>
  );
}

export default DashboardMain;
