'use client';

import { useState, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  required?: boolean;
}

function formatMiles(raw: string): string {
  const num = raw.replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('es-AR').format(parseInt(num, 10));
}

export default function MontoInput({ value, onChange, placeholder = '0', required }: Props) {
  const [display, setDisplay] = useState(formatMiles(value));

  useEffect(() => {
    setDisplay(formatMiles(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setDisplay(formatMiles(raw));
    onChange(raw);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">$</span>
      <input
        type="text"
        inputMode="numeric"
        className="input pl-7"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        required={required}
      />
    </div>
  );
}
