import { NextResponse } from "next/server"
import { getBloggerPosts } from "@/lib/blogger"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const posts = await getBloggerPosts(20)
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

