import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session on /admin requests and redirects anonymous
 * visitors to the login page. This is a convenience layer only: every admin
 * page and server action re-checks authorization with requireAdmin().
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLogin = request.nextUrl.pathname === "/admin/login";

  const redirectToLogin = () => {
    const target = request.nextUrl.clone();
    target.pathname = "/admin/login";
    target.search = "";
    return NextResponse.redirect(target);
  };

  if (!url || !key) return isLogin ? response : redirectToLogin();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user && !isLogin) return redirectToLogin();

  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}
