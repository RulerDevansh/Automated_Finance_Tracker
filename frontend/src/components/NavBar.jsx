import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/categories', label: 'Categories' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/reports', label: 'Reports' }
];

export const NavBar = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="bg-ink text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="font-semibold tracking-tight text-lg">Finance Tracker</Link>
        <div className="hidden sm:flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`hover:text-mint ${pathname.startsWith(link.to) ? 'text-mint' : 'text-white/80'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {user && (
          <Link to="/profile" className="text-white/80 hover:text-mint">
            {user.full_name || user.fullName}
          </Link>
        )}
        <button onClick={logout} className="bg-mint text-ink px-3 py-1 rounded hover:bg-white transition">
          Logout
        </button>
      </div>
    </nav>
  );
};
