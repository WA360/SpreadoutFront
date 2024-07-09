import { NextRequest, NextResponse } from 'next/server';

interface Routes {
  [key: string]: boolean;
}

const publicOnlyUrls: Routes = {
  '/login': true,
  '/signup': true,
};

export async function middleware(request: NextRequest) {
  const cookies = request.cookies.get('token')?.value;
  const exists = publicOnlyUrls[request.nextUrl.pathname];

  if (!cookies) {
    if (!exists) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    if (exists) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
