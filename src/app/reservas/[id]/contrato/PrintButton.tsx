'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <div className="print:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-end">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Printer size={15} />
        Guardar / Imprimir PDF
      </button>
    </div>
  );
}
