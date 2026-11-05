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
 * Parser untuk item dari Google Cloud Blogger API v3
 */
function parseApiV3ItemToBlogPost(item: any): BlogPost {
  const id = item.id || ""
  const title = item.title || "Tanpa Judul"
  const fullContent = item.content || ""

  let thumbnail = ""
  if (item.images && item.images.length > 0 && item.images[0].url) {
    thumbnail = item.images[0].url
  } else {
    const match = fullContent.match(/<img[^>]+src=["']([^"']+)["']/)
    thumbnail = match ? match[1] : "/img/beritaiklim.jpg"
  }

  const dateFormatted = formatDateIndo(item.published)
  const plainText = cleanHtmlEntities(
    fullContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  )
  const summary = plainText.length > 150 ? `${plainText.slice(0, 150)}...` : plainText

  const categories = item.labels || ["Publikasi"]
  const author = item.author?.displayName || "Jerukagung Seismologi"
  const originalUrl = item.url || ""

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
  const fullContent = item.content?.$t || item.summary?.$t || ""

  let thumbnail = item.media$thumbnail?.url
  if (thumbnail) {
    thumbnail = thumbnail.replace(/\/s\d+(-c)?\//, "/w800-h450-c/")
  } else {
    const match = fullContent.match(/<img[^>]+src=["']([^"']+)["']/)
    thumbnail = match ? match[1] : "/img/beritaiklim.jpg"
  }

  const dateFormatted = formatDateIndo(item.published?.$t)
  const plainText = cleanHtmlEntities(
    fullContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  )
  const summary = plainText.length > 150 ? `${plainText.slice(0, 150)}...` : plainText
  const categories = item.category?.map((c: any) => c.term).filter(Boolean) || ["Publikasi"]
  const author = item.author?.[0]?.name?.$t || "Jerukagung Seismologi"

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
