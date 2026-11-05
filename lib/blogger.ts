export interface BlogPost {
  id: string
  title: string
  date: string
  isoDate?: string
  summary: string
  content?: string
  thumbnail: string
  author?: string
  categories?: string[]
  url?: string
  isDraft?: boolean
  commentsCount?: number
}

function cleanHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

export function formatDateIndo(dateString?: string): string {
  if (!dateString) return ""
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString))
  } catch {
    return dateString.split("T")[0]
  }
}

/**
 * Mengoptimalkan URL gambar Blogger agar beresolusi tinggi (HD/1600px) dan tidak pecah/mozaik.
 * Menghapus/mengganti parameter kompresi kecil Blogger (seperti s72, s72-c, s72-w299-h400-c, w299-h400, s320)
 * menjadi ukuran target beresolusi tinggi (default: s1600).
 */
export function optimizeBloggerImageUrl(url?: string, sizeParam: string = "s1600"): string {
  if (!url) return "/img/beritaiklim.jpg"

  if (
    url.includes("blogger.googleusercontent.com") ||
    url.includes("bp.blogspot.com") ||
    url.includes("googleusercontent.com")
  ) {
    const sizeRegex = /\/([swh]\d+[^/]*|s0)\/([^/]+)$/
    if (sizeRegex.test(url)) {
      return url.replace(sizeRegex, `/${sizeParam}/$2`)
    }
  }

  return url
}

/**
 * Mengoptimalkan semua gambar di dalam konten HTML artikel agar tidak pecah/mozaik
 */
export function optimizeBloggerContentImages(contentHtml: string): string {
  if (!contentHtml) return ""

  return contentHtml.replace(
    /(https:\/\/(?:blogger\.googleusercontent\.com|[\w-]+\.bp\.blogspot\.com|[\w-]+\.googleusercontent\.com)\/[^"'\s<>]+?\/)([swh]\d+[^/]*|s0)\/([^"'\s<>]+)/g,
    (match, prefix, oldSize, filename) => {
      if (oldSize === "s1600" || oldSize === "s2400" || oldSize === "s0") {
        return match
      }
      return `${prefix}s1600/${filename}`
    }
  )
}

/**
 * Parser untuk item dari Google Cloud Blogger API v3
 */
export function parseApiV3ItemToBlogPost(item: any): BlogPost {
  const id = item.id || ""
  const title = item.title || "Tanpa Judul"
  const rawContent = item.content || ""
  const fullContent = optimizeBloggerContentImages(rawContent)

  let thumbnail = ""
  if (item.images && item.images.length > 0 && item.images[0].url) {
    thumbnail = item.images[0].url
  } else {
    const match = fullContent.match(/<img[^>]+src=["']([^"']+)["']/)
    thumbnail = match ? match[1] : "/img/beritaiklim.jpg"
  }
  thumbnail = optimizeBloggerImageUrl(thumbnail, "s1600")

  const dateFormatted = formatDateIndo(item.published || item.updated)
  const plainText = cleanHtmlEntities(
    fullContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  )
  const summary = plainText.length > 150 ? `${plainText.slice(0, 150)}...` : plainText

  const categories = item.labels || ["Publikasi"]
  const author = item.author?.displayName || "Jerukagung Seismologi"
  const originalUrl = item.url || ""
  const isDraft = String(item.status || "").toUpperCase() === "DRAFT"
  const commentsCount = Number(item.replies?.totalItems || 0)

  return {
    id,
    title,
    date: dateFormatted,
    isoDate: item.published || item.updated || "",
    summary: summary || "Tidak ada ringkasan teks.",
    content: fullContent,
    thumbnail,
    author,
    categories,
    url: originalUrl,
    isDraft,
    commentsCount,
  }
}

/**
 * Parser untuk item dari Blogger Public Feed (Atom/JSON)
 */
function parseFeedEntryToBlogPost(item: any, fallbackIndex: number = 0): BlogPost {
  const rawId = item.id?.$t || ""
  const id = rawId.includes(".post-")
    ? rawId.split(".post-")[1]
    : rawId.split("-").pop() || `post-${fallbackIndex}`

  const originalUrl = item.link?.find((l: any) => l.rel === "alternate")?.href || ""
  const rawContent = item.content?.$t || item.summary?.$t || ""
  const fullContent = optimizeBloggerContentImages(rawContent)

  let thumbnail = item.media$thumbnail?.url
  if (!thumbnail) {
    const match = fullContent.match(/<img[^>]+src=["']([^"']+)["']/)
    thumbnail = match ? match[1] : "/img/beritaiklim.jpg"
  }
  thumbnail = optimizeBloggerImageUrl(thumbnail, "s1600")

  const dateFormatted = formatDateIndo(item.published?.$t)
  const plainText = cleanHtmlEntities(
    fullContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  )
  const summary = plainText.length > 150 ? `${plainText.slice(0, 150)}...` : plainText
  const categories = item.category?.map((c: any) => c.term).filter(Boolean) || ["Publikasi"]
  const author = item.author?.[0]?.name?.$t || "Jerukagung Seismologi"
  const commentsCount = Number(item.thr$total?.$t || 0)

  return {
    id,
    title: item.title?.$t || "Tanpa Judul",
    date: dateFormatted,
    isoDate: item.published?.$t || item.updated?.$t || "",
    summary: summary || "Tidak ada ringkasan teks.",
    content: fullContent,
    thumbnail,
    author,
    categories,
    url: originalUrl,
    isDraft: false,
    commentsCount,
  }
}

const DEFAULT_BLOG_ID = "3729627085550627147"
const DEFAULT_BLOG_URL = "https://jerukagunglabs.blogspot.com/"

function getCredentials() {
  const apiKey = (
    process.env.NEXT_PUBLIC_BLOGGER_API_KEY ||
    process.env.BLOGGER_API_KEY ||
    ""
  ).trim()

  const blogId = (
    process.env.NEXT_PUBLIC_BLOG_ID ||
    process.env.BLOGGER_BLOG_ID ||
    DEFAULT_BLOG_ID
  ).trim()

  const blogUrl = (
    process.env.NEXT_PUBLIC_BLOGGER_URL ||
    process.env.BLOGGER_URL ||
    DEFAULT_BLOG_URL
  ).trim()

  return { apiKey, blogId, blogUrl }
}

/**
 * Mengambil daftar postingan terbaru khusus dan murni dari Google Blogger
 */
export async function getBloggerPosts(maxResults: number = 10): Promise<BlogPost[]> {
  const { apiKey, blogId, blogUrl } = getCredentials()

  // 1. Prioritas Utama: Google Cloud Blogger API v3
  if (apiKey && blogId) {
    try {
      const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}&maxResults=${maxResults}`
      const res = await fetch(endpoint, {
        next: { revalidate: 60 }, // Revalidate cache tiap 60 detik agar postingan baru cepat muncul
      })

      if (res.ok) {
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          return data.items.map(parseApiV3ItemToBlogPost)
        }
      } else {
        console.warn(`[Blogger API v3] HTTP status ${res.status}: ${res.statusText}`)
      }
    } catch (error) {
      console.warn("[Blogger API v3] Fetch error:", error)
    }
  }

  // 2. Fallback: Blogger Public JSON Feed
  if (blogUrl) {
    try {
      const cleanUrl = blogUrl.replace(/\/$/, "")
      const endpoint = `${cleanUrl}/feeds/posts/default?alt=json&max-results=${maxResults}`
      const res = await fetch(endpoint, {
        next: { revalidate: 60 },
      })

      if (res.ok) {
        const data = await res.json()
        const entries = data.feed?.entry || []
        if (entries.length > 0) {
          return entries.map((item: any, idx: number) => parseFeedEntryToBlogPost(item, idx))
        }
      }
    } catch (error) {
      console.warn("[Blogger Feed] Fetch error:", error)
    }
  }

  // Jika belum ada artikel di Blogger, kembalikan array kosong (tidak menampilkan dummy/fake report)
  return []
}

/**
 * Mengambil satu artikel lengkap dari Blogger berdasarkan ID postingan
 */
export async function getBloggerPostById(id: string): Promise<BlogPost | null> {
  const { apiKey, blogId, blogUrl } = getCredentials()

  // 1. Google Cloud Blogger API v3
  if (apiKey && blogId) {
    try {
      const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${id}?key=${apiKey}`
      const res = await fetch(endpoint, {
        next: { revalidate: 60 },
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.id) {
          return parseApiV3ItemToBlogPost(data)
        }
      }
    } catch (error) {
      console.warn(`[Blogger API v3] Error fetching post ${id}:`, error)
    }
  }

  // 2. Blogger Public JSON Feed
  if (blogUrl) {
    try {
      const cleanUrl = blogUrl.replace(/\/$/, "")
      const endpoint = `${cleanUrl}/feeds/posts/default/${id}?alt=json`
      const res = await fetch(endpoint, {
        next: { revalidate: 60 },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.entry) {
          return parseFeedEntryToBlogPost(data.entry)
        }
      }
    } catch (error) {
      console.warn(`[Blogger Feed] Error fetching post ${id}:`, error)
    }
  }

  // 3. Cari dari daftar postingan terbaru jika direct ID feed berbeda format
  const recentPosts = await getBloggerPosts(50)
  const found = recentPosts.find((p) => p.id === id)
  if (found) return found

  return null
}
