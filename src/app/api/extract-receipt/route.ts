import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

const CATEGORIAS = ['Limpieza', 'Impuestos', 'Mantenimiento', 'Servicios', 'Otros'];

// Claude soporta jpeg, png, gif, webp — normalizar cualquier otro tipo a jpeg
function normalizeMediaType(type: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  if (type === 'image/png')  return 'image/png';
  if (type === 'image/webp') return 'image/webp';
  if (type === 'image/gif')  return 'image/gif';
  return 'image/jpeg'; // jpg, heic, heif, bmp → tratar como jpeg
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mediaType = normalizeMediaType(file.type ?? '');

    const hoy = new Date().toISOString().split('T')[0];

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
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
    console.error('extract-receipt error:', err);
    return NextResponse.json({ error: 'Error al procesar el comprobante.' }, { status: 500 });
  }
}
