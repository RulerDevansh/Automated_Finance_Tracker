import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 className="text-4xl font-bold">404</h1>
    <p className="text-slate-600">Page not found</p>
    <Link to="/dashboard" className="text-mint font-semibold">Go home</Link>
  </div>
);
