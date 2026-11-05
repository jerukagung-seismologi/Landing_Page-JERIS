import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getOAuthConfig } from "@/lib/blogger-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const { clientId, clientSecret } = getOAuthConfig()
  const hasClientConfig = Boolean(clientId && clientSecret)

  const cookieStore = await cookies()
  const cookieToken = cookieStore.get("blogger_refresh_token")?.value
  const envToken = process.env.GOOGLE_REFRESH_TOKEN

  const isConnected = Boolean(hasClientConfig && (cookieToken || envToken))

  return NextResponse.json({
    hasClientConfig,
    isConnected,
    clientIdConfigured: Boolean(clientId),
  })
}

