import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

import { requireAuth, tienePermiso } from '@/lib/auth-guard';
import { leerArchivoPago } from '@/lib/pagos';
import { errorLecturaComprobante } from '@/lib/receipt-errors';

const CATEGORIAS = ['Limpieza', 'Impuestos', 'Mantenimiento', 'Servicios', 'Otros'];

export async function POST(req: NextRequest) {
  try {
    const usuario = await requireAuth();
    if (!tienePermiso(usuario, 'gastos', 'crear') && !tienePermiso(usuario, 'gastos', 'editar')) throw new Error('Sin permiso');
  } catch {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }
  try {
    const formData = await req.formData();
    const archivo = await leerArchivoPago(formData);
    if (!archivo) return NextResponse.json({ error: 'No se recibió archivo.' }, { status: 400 });
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'Lectura automática no disponible.' }, { status: 503 });
    const client = new Anthropic({ timeout: 20000, maxRetries: 0 });
    const base64 = archivo.contenido.toString('base64');
    const documento: Anthropic.Messages.ContentBlockParam = archivo.tipo === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
      : { type: 'image', source: { type: 'base64', media_type: archivo.tipo as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 } };

    const hoy = new Date().toISOString().split('T')[0];

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            documento,
            {
              type: 'text',
              text: `Sos un asistente que extrae datos de comprobantes de gastos argentinos.

La imagen puede ser cualquiera de estos tipos de documento:
- Ticket o factura de un comercio
- Boleta de un servicio (luz, agua, internet, etc.)
- Comprobante de transferencia bancaria (screenshot de Mercado Pago, homebanking, Naranja X, MODO, Brubank, Lemon, Prex, etc.)
- Foto de un recibo de pago
- Cualquier otro comprobante de pago

Hoy es ${hoy}. Si no se ve la fecha, usá la fecha de hoy.

Categorías disponibles: ${CATEGORIAS.join(', ')}.

Para comprobantes de transferencia: buscá el monto/importe transferido, la fecha de la operación y el concepto/motivo si lo hay. Ignorá el CBU/CVU, alias y datos del destinatario para la descripción.

Respondé ÚNICAMENTE con un JSON válido, sin texto adicional:
{
  "fecha": "YYYY-MM-DD",
  "descripcion": "descripción breve del gasto en español, máx 60 caracteres",
  "monto": 12345,
  "categoria": "una de las categorías disponibles",
  "tipo": "ordinario"
}

Reglas:
- monto: número entero sin puntos ni comas (ej: 15000), en pesos argentinos. Si es el total con IVA, usá ese valor.
- categoria: la más apropiada según el tipo de gasto.
- tipo: "ordinario" en la mayoría de los casos; "extraordinario" solo si es un gasto excepcional o urgente.
- Si hay ambigüedad en algún campo, elegí la opción más razonable sin preguntar.`,
            },
          ],
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No se pudo interpretar el comprobante.' }, { status: 422 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (err) {
    const fallo = errorLecturaComprobante(err);
    console.error('extract-receipt error:', { status: fallo.status, code: fallo.code });
    return NextResponse.json({ error: fallo.message, code: fallo.code }, { status: fallo.status });
  }
}
