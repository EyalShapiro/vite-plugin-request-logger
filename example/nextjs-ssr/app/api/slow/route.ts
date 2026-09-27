import { NextResponse } from 'next/server';

/**
 * GET /api/slow
 * Simulates a slow backend database call (150ms delay).
 */
export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return NextResponse.json({
    status: 'ok',
    duration: '150ms',
    message: 'Delayed response completed',
  });
}
