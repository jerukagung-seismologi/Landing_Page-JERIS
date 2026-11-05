import { NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/blogger-auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      `${origin}/dashboard?oauth_error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/dashboard?oauth_error=Kode+otorisasi+tidak+ditemukan`
    )
  }

  try {
    const redirectUri = `${origin}/api/blogger/auth/callback`
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    const response = NextResponse.redirect(
      `${origin}/dashboard?oauth=connected${
        tokens.refresh_token ? "&new_token=true" : ""
      }`
    )

    if (tokens.refresh_token) {
      // Simpan refresh_token di secure httpOnly cookie (berlaku 1 tahun)
      response.cookies.set("blogger_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 365 * 24 * 60 * 60, // 1 tahun
      })
    }

    return response
  } catch (err: any) {
    console.error("[OAuth Callback Error]:", err)
    return NextResponse.redirect(
      `${origin}/dashboard?oauth_error=${encodeURIComponent(
        err?.message || "Gagal memproses token OAuth"
      )}`
    )
  }
}

