import { NextResponse } from "next/server"
import { getBloggerPosts, parseApiV3ItemToBlogPost } from "@/lib/blogger"
import { createBloggerPost, getAuthBloggerPosts } from "@/lib/blogger-auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    // 1. Coba ambil daftar artikel lengkap (LIVE + DRAFT) via Google Blogger OAuth
    try {
      const authItems = await getAuthBloggerPosts(50)
      if (Array.isArray(authItems) && authItems.length > 0) {
        const posts = authItems.map(parseApiV3ItemToBlogPost)
        return NextResponse.json(posts, {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        })
      }
    } catch (authErr) {
      console.warn("[API Blogger Posts] OAuth draft fetch fallback to public:", authErr)
    }

    // 2. Fallback ke publik reader (jika akun Google belum terhubung)
    const posts = await getBloggerPosts(30)
    return NextResponse.json(posts, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("[API Blogger Posts] Error:", error)
    return NextResponse.json({ error: "Failed to fetch Blogger posts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, labels, isDraft } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Judul dan konten postingan wajib diisi." },
        { status: 400 }
      )
    }

    const newPost = await createBloggerPost({
      title,
      content,
      labels: Array.isArray(labels)
        ? labels
        : typeof labels === "string"
        ? labels.split(",").map((l: string) => l.trim()).filter(Boolean)
        : [],
      isDraft: Boolean(isDraft),
    })

    return NextResponse.json(
      { message: "Postingan berhasil dibuat di Blogger!", post: newPost },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[API Create Blogger Post] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Gagal membuat postingan di Blogger" },
      { status: 500 }
    )
  }
}


