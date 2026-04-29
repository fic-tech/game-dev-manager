import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "redmine_session";

const PUBLIC_PATHS = new Set<string>(["/login"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的アセット・画像最適化・API ルートは素通し
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!sessionId && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ログイン済みで /login にアクセスしたら / にリダイレクト
  if (sessionId && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
