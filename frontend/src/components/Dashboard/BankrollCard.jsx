import React from 'react';

const colorMap = {
  brand: 'text-brand-500',
  success: 'text-success',
  danger: 'text-danger',
  blue: 'text-blue-400',
  gray: 'text-gray-300',
};

export default function BankrollCard({ label, value, sub, color = 'brand' }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
}
