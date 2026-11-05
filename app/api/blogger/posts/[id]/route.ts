import { NextResponse } from "next/server"
import {
  updateBloggerPost,
  deleteBloggerPost,
  getAuthBloggerPostById,
  publishBloggerPost,
  revertBloggerPostToDraft,
} from "@/lib/blogger-auth"
import { getBloggerPostById, parseApiV3ItemToBlogPost } from "@/lib/blogger"

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // 1. Coba ambil via OAuth (bisa membaca artikel status LIVE maupun DRAFT)
    try {
      const authPostItem = await getAuthBloggerPostById(id)
      if (authPostItem && authPostItem.id) {
        return NextResponse.json(parseApiV3ItemToBlogPost(authPostItem))
      }
    } catch (authErr) {
      console.warn(`[API Get Single Post] OAuth fetch fallback for ${id}:`, authErr)
    }

    // 2. Fallback publik
    const post = await getBloggerPostById(id)
    if (!post) {
      return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 })
    }
    return NextResponse.json(post)
  } catch (error: any) {
    console.error("[API Get Single Blogger Post] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Gagal mengambil postingan" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, content, labels, publish, revert } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Judul dan konten postingan wajib diisi." },
        { status: 400 }
      )
    }

    const updated = await updateBloggerPost(id, {
      title,
      content,
      labels: Array.isArray(labels)
        ? labels
        : typeof labels === "string"
        ? labels.split(",").map((l: string) => l.trim()).filter(Boolean)
        : [],
    })

    // Jika diminta mempublikasikan draf
    if (publish) {
      try {
        await publishBloggerPost(id)
      } catch (pubErr) {
        console.warn(`[API Update] Publish call warning:`, pubErr)
      }
    } else if (revert) {
      try {
        await revertBloggerPostToDraft(id)
      } catch (revErr) {
        console.warn(`[API Update] Revert call warning:`, revErr)
      }
    }

    return NextResponse.json({
      message: publish
        ? "Draf artikel berhasil dipublikasikan ke Blogger!"
        : revert
        ? "Artikel berhasil dikembalikan ke status Draf di Blogger!"
        : "Postingan berhasil diperbarui di Blogger!",
      post: updated,
    })
  } catch (error: any) {
    console.error("[API Update Blogger Post] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Gagal memperbarui postingan di Blogger" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteBloggerPost(id)
    return NextResponse.json({
      message: "Postingan berhasil dihapus dari Blogger!",
    })
  } catch (error: any) {
    console.error("[API Delete Blogger Post] Error:", error)
    return NextResponse.json(
      { error: error?.message || "Gagal menghapus postingan di Blogger" },
      { status: 500 }
    )
  }
}

