import { NextRequest, NextResponse } from 'next/server';

interface Routes {
  [key: string]: boolean;
}

const publicOnlyUrls: Routes = {
  '/login': true,
  '/signup': true,
};

export async function middleware(request: NextRequest) {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6Iu2FjOyKpOydtCIsInVzZXJJZCI6InRlc3QyIiwidXVpZCI6MiwiaWF0IjoxNzIzMjkxMDczLCJleHAiOjE3MjM4MzEwNzN9.F7Zdp5Shllu_PsRHq-0py_wmtonkfKeFaPbj8zsI6Q4';
  const isPublicOnly = publicOnlyUrls[request.nextUrl.pathname];

  if (!token) {
    // 사용자가 인증되지 않았으며 보호된 페이지에 접근하려는 경우
    if (!isPublicOnly) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else {
    // 사용자가 인증되었으며 로그인 페이지 또는 회원가입 페이지에 접근하려는 경우
    if (isPublicOnly) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 그 외의 경우 요청을 계속 진행
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
