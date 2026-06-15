import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: 'DATABASE_URL not set' }, { status: 500 });
  }

  const isLocal = url.includes('localhost');
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });

  try {
    const { rows } = await pool.query('SELECT COUNT(*) AS reservas FROM reservas');
    await pool.end();
    return NextResponse.json({
      ok: true,
      reservas: rows[0].reservas,
      url: url.replace(/:[^:@]+@/, ':***@'),
    });
  } catch (err: unknown) {
    await pool.end().catch(() => {});
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      error,
      url: url.replace(/:[^:@]+@/, ':***@'),
    }, { status: 500 });
  }
}
