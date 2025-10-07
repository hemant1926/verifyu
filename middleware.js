import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token");
  const url = new URL(request.url);
  const path = url.pathname;
  if (path.includes("/api")) {
    return NextResponse.next();
  }


  if (path === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (token && path !== "/") {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/dashboard/:path*", "/login/:path*", "/"],
};
