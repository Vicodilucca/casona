import { NextResponse } from 'next/server';
import { getRecordatoriosIngreso, getReservas } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const usuario = await getCurrentUser();
  if (!usuario) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const diasParam = searchParams.get('dias');
  const diasMax = diasParam ? parseInt(diasParam, 10) : 2;

  try {
    let recordatorios = await getRecordatoriosIngreso(diasMax);

    // Si no hay ingresos en los próximos `diasMax` días, buscar la próxima reserva disponible para dar contexto útil
    let proximaReserva = null;
    if (recordatorios.length === 0) {
      const hoy = new Date().toISOString().split('T')[0];
      const todasFuturas = await getReservas(hoy, '2099-12-31').catch(() => []);
      const confirmadasFuturas = todasFuturas
        .filter(r => r.estado === 'confirmada' && String(r.fecha_inicio).slice(0, 10) >= hoy)
        .sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)));
      
      if (confirmadasFuturas.length > 0) {
        proximaReserva = confirmadasFuturas[0];
      }
    }

    const items = recordatorios.map((r) => {
      const fechaStr = String(r.fecha_inicio).slice(0, 10);
      const hoyStr = new Date().toISOString().split('T')[0];
      
      const diffMs = new Date(fechaStr + 'T00:00:00').getTime() - new Date(hoyStr + 'T00:00:00').getTime();
      const diasFaltantes = Math.round(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: r.id,
        huesped: r.huesped,
        dni: r.dni || 'No registrado',
        direccion: r.direccion || 'No registrada',
        fecha_inicio: fechaStr,
        hora_inicio: r.hora_inicio || '14:00',
        fecha_fin: String(r.fecha_fin).slice(0, 10),
        hora_fin: r.hora_fin || '10:00',
        dias_faltantes: diasFaltantes,
        es_hoy: diasFaltantes === 0,
        es_manana: diasFaltantes === 1,
        es_en_2_dias: diasFaltantes === 2,
        adultos: r.adultos,
        ninos: r.ninos,
        mascotas: r.mascotas,
        plataforma: r.plataforma,
        monto: r.monto,
        saldo_pendiente: r.saldo_pendiente,
        saldo_pagado: r.saldo_pagado,
        notas: r.notas,
        resumen_recordatorio: `📌 RECORDATORIO DE INGRESO (${diasFaltantes === 0 ? '¡HOY!' : diasFaltantes === 1 ? '¡MAÑANA!' : `En ${diasFaltantes} días`}):\n• Huésped: ${r.huesped}\n• Check-in: ${fechaStr} a las ${r.hora_inicio || '14:00'}hs\n• Check-out: ${String(r.fecha_fin).slice(0, 10)} a las ${r.hora_fin || '10:00'}hs\n• Personas: ${r.adultos} adultos, ${r.ninos} niños, ${r.mascotas} mascotas\n• Plataforma: ${r.plataforma.toUpperCase()}\n• Saldo a cobrar: $${r.saldo_pendiente} ARS (${r.saldo_pagado ? 'Pagado' : 'Pendiente'})\n• DNI: ${r.dni || 'S/D'} | Dirección: ${r.direccion || 'S/D'}${r.notas ? `\n• Notas: ${r.notas}` : ''}`
      };
    });

    return NextResponse.json({
      success: true,
      dias_busqueda: diasMax,
      cantidad: items.length,
      recordatorios: items,
      proxima_reserva_futura: proximaReserva ? {
        id: proximaReserva.id,
        huesped: proximaReserva.huesped,
        fecha_inicio: String(proximaReserva.fecha_inicio).slice(0, 10),
        hora_inicio: proximaReserva.hora_inicio
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener recordatorios' }, { status: 500 });
  }
}
