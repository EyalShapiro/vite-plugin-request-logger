import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js 14 Middleware (Edge/Node) — Route-level request logging & trace header injection.
 *
 * Runs on every request BEFORE it reaches App Router API route handlers.
 *
 * @param {NextRequest} request - Incoming Next.js request.
 * @returns {NextResponse} Modified Next.js response.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Only handle API routes
  if (pathname.startsWith('/api')) {
    const start = Date.now();
    const method = request.method;

    // Propagate or create trace ID
    const traceId = request.headers.get('x-trace-id') || request.headers.get('x-request-id') || crypto.randomUUID();

    const response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });

    response.headers.set('X-Trace-ID', traceId);

    const duration = Date.now() - start;
    console.info(`[VPRL Edge] ${method.padEnd(6)} ${pathname}${search} +${duration}ms [trace:${traceId.slice(0, 8)}]`);

    return response;
  }

  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*'] };
