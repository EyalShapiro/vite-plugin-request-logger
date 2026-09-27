import { NextResponse } from 'next/server';

/**
 * GET /api/users
 * Returns list of mock users.
 */
export async function GET() {
  return NextResponse.json({
    status: 'success',
    users: [
      { id: 1, name: 'Eyal Shapiro', role: 'Maintainer' },
      { id: 2, name: 'Developer User', role: 'Engineer' },
    ],
  });
}

/**
 * POST /api/users
 * Accepts new user creation request.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(
    {
      status: 'created',
      message: 'User created successfully',
      data: body,
    },
    { status: 201 },
  );
}
