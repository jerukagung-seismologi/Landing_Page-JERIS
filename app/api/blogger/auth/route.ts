import { NextResponse } from "next/server"
import { getGoogleOAuthURL, getOAuthConfig } from "@/lib/blogger-auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { clientId, clientSecret } = getOAuthConfig()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: "Kredensial Google OAuth belum lengkap.",
          message:
            "Harap tambahkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env.local",
        },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const redirectUri = `${url.origin}/api/blogger/auth/callback`
    const authUrl = getGoogleOAuthURL(redirectUri)
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Gagal menginisialisasi OAuth Google" },
      { status: 500 }
    )
  }
}

