import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const fecha = req.nextUrl.searchParams.get('fecha');
  if (!fecha) return NextResponse.json({ error: 'Falta fecha' }, { status: 400 });

  // Intenta hasta 5 días hacia atrás (fines de semana / feriados)
  for (let i = 0; i < 5; i++) {
    const d = new Date(fecha + 'T12:00:00Z');
    d.setDate(d.getDate() - i);
    const year  = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day   = String(d.getUTCDate()).padStart(2, '0');

    try {
      const res = await fetch(
        `https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial/${year}/${month}/${day}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) continue;
      const json = await res.json();
      if (json.venta) {
        return NextResponse.json({
          cotizacion: Math.round(json.venta),
          fecha: `${year}-${month}-${day}`,
        });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: 'No se encontró cotización' }, { status: 404 });
}
