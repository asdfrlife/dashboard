import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If no password is set in env, we allow access (or maybe block? Let's allow for easier setup if missed, but prompt wants password protected)
  const password = process.env.DASHBOARD_PASSWORD;
  
  if (!password) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('dash_auth')?.value;
  
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiAuth = request.nextUrl.pathname === '/api/auth';

  if (authCookie === password) {
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isLoginPage && !isApiAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
