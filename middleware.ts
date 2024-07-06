import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const cookies = request.cookies.get("token")?.value;
  console.log("cookies", cookies);

  if (!cookies && request.nextUrl.pathname !== "/login") {
    console.log("token does not exist");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (cookies && request.nextUrl.pathname === "/login") {
    console.log("token exists");
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
