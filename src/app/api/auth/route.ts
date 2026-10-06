import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const envPassword = process.env.DASHBOARD_PASSWORD;

  if (password === envPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'dash_auth',
      value: password,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
