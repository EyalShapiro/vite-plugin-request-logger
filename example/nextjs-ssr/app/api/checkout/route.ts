import { NextResponse } from 'next/server';

/**
 * POST /api/checkout
 * Demonstrates sensitive payload redaction (e.g. creditCard, password, secret).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    status: 'ok',
    orderId: `ORD-${Math.floor(Math.random() * 90000) + 10000}`,
    processedAt: new Date().toISOString(),
    itemCount: Array.isArray(body.items) ? body.items.length : 1,
  });
}
