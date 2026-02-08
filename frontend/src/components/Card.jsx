import React from 'react';

export const Card = ({ title, children, action, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm p-5 border border-slate-100 ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);
