import React from 'react';

export const Stat = ({ label, value, accent = 'text-ink' }) => (
  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{label}</div>
    <div className={`text-2xl font-semibold ${accent}`}>{value}</div>
  </div>
);
