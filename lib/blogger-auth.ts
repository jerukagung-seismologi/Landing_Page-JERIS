import { cookies } from "next/headers"

export function getOAuthConfig() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim()
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim()
  const redirectUri = (
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/blogger/auth/callback"
  ).trim()
  const blogId = (
    process.env.NEXT_PUBLIC_BLOG_ID ||
    process.env.BLOGGER_BLOG_ID ||
    "3729627085550627147"
  ).trim()

  return { clientId, clientSecret, redirectUri, blogId }
}

/**
 * Buat URL persetujuan OAuth 2.0 Google untuk Blogger
 */
export function getGoogleOAuthURL(customRedirectUri?: string): string {
  const { clientId, redirectUri } = getOAuthConfig()
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID belum diatur di file .env.local")
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth"
  const options = {
    redirect_uri: customRedirectUri || redirectUri,
    client_id: clientId,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/blogger",
  }

  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

/**
 * Tukar authorization code dengan Access Token & Refresh Token
 */
export async function exchangeCodeForTokens(
  code: string,
  customRedirectUri?: string
): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
}> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig()

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: customRedirectUri || redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      `Gagal menukar token Google OAuth: ${errorData.error_description || res.statusText}`
    )
  }

  return res.json()
}

/**
 * Ambil Access Token aktif menggunakan Refresh Token
 */
export async function getValidAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getOAuthConfig()

  // Cari refresh token dari env atau cookie
  let refreshToken = (process.env.GOOGLE_REFRESH_TOKEN || "").trim()

  if (!refreshToken) {
    try {
      const cookieStore = await cookies()
      refreshToken = cookieStore.get("blogger_refresh_token")?.value || ""
    } catch {
      // In non-request contexts or client-side
    }
  }

  if (!refreshToken) {
    throw new Error(
      "Akun Google Blogger belum terhubung (Refresh Token tidak ditemukan). Silakan klik 'Hubungkan Akun Google Blogger' di Dashboard."
    )
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Gagal memperbarui access token Google: ${err.error_description || res.statusText}`)
  }

  const data = await res.json()
  return data.access_token
}

/**
 * Buat Postingan Baru di Blogger (Create)
 */
export async function createBloggerPost(postData: {
  title: string
  content: string
  labels?: string[]
  isDraft?: boolean
}) {
  const { blogId } = getOAuthConfig()
  const accessToken = await getValidAccessToken()

  const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/?isDraft=${Boolean(
    postData.isDraft
  )}`

  const payload: any = {
    kind: "blogger#post",
    title: postData.title,
    content: postData.content,
  }

  if (postData.labels && postData.labels.length > 0) {
    payload.labels = postData.labels
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gagal membuat postingan di Blogger (${res.status})`)
  }

  return res.json()
}

/**
 * Perbarui Postingan yang Ada di Blogger (Update/Edit)
 */
export async function updateBloggerPost(
  postId: string,
  postData: {
    title: string
    content: string
    labels?: string[]
  }
) {
  const { blogId } = getOAuthConfig()
  const accessToken = await getValidAccessToken()

  const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${postId}`

  const payload: any = {
    kind: "blogger#post",
    id: postId,
    title: postData.title,
    content: postData.content,
  }

  if (postData.labels && postData.labels.length > 0) {
    payload.labels = postData.labels
  }

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gagal memperbarui postingan di Blogger (${res.status})`)
  }

  return res.json()
}

/**
 * Hapus Postingan dari Blogger (Delete)
 */
export async function deleteBloggerPost(postId: string) {
  const { blogId } = getOAuthConfig()
  const accessToken = await getValidAccessToken()

  const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${postId}`

  const res = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gagal menghapus postingan di Blogger (${res.status})`)
  }

  return { success: true }
}

